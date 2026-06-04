// @ts-nocheck
import engineClient, { ENGINE_BASE_URL } from './engineClient.js';
import { derivePipeline, deriveFork } from './derivePipeline.js';
import { unwrapEngineTaskPayload } from './engineTaskUtils.js';
import {
  mapEngineStatus,
  isTerminalEngineStatus,
  isActiveEngineStatus,
  extractTaskAnswer,
} from './engineTaskUtils.js';
import { PIPELINE_WS_EVENTS } from './pipelineWsEvents.js';
import { engineTaskStore } from './engineTaskStore.js';

const RUN_POLL_MS = 4000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function findStepIndex(steps, stepId, index) {
  if (stepId != null) {
    const i = steps.findIndex((s) => String(s.id) === String(stepId));
    if (i >= 0) return i;
  }
  if (index != null && index >= 0 && index < steps.length) return index;
  return -1;
}

function sanitizeDiffPath(path) {
  const p = String(path || '');
  if (!p) return null;
  if (p.includes('..')) return null;
  if (/^\/etc|^\/usr|^\/var|^\/System|^C:\\/i.test(p)) return null;
  return p;
}

class PipelineRuntimeStore {
  constructor() {
    /** @type {Map<string, object>} */
    this.runtimes = new Map();
    this.listeners = new Set();
    this.wsInitialized = false;
    this.pendingApprovalsCount = 0;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.getGlobalSnapshot());
    return () => this.listeners.delete(fn);
  }

  _notify() {
    const snap = this.getGlobalSnapshot();
    this.listeners.forEach((fn) => {
      try {
        fn(snap);
      } catch (e) {
        console.error('[pipelineRuntimeStore]', e);
      }
    });
  }

  getGlobalSnapshot() {
    return {
      pendingApprovalsCount: this.pendingApprovalsCount,
      runtimes: Object.fromEntries(
        [...this.runtimes.entries()].map(([id, rt]) => [id, this.getRuntimeSnapshot(id)]),
      ),
    };
  }

  getRuntimeSnapshot(taskId) {
    const rt = this.runtimes.get(String(taskId));
    if (!rt) return null;
    return {
      taskId: rt.taskId,
      mode: rt.mode,
      pipeline: rt.pipeline,
      selectedStepId: rt.selectedStepId,
      terminalBuffers: { ...rt.terminalBuffers },
      loadState: rt.loadState,
      error: rt.error,
      diffFiles: rt.diffFiles,
      diffLoading: rt.diffLoading,
      stopping: rt.stopping,
      rollingBack: rt.rollingBack,
    };
  }

  _ensureRuntime(taskId, mode = 'live') {
    const id = String(taskId);
    if (!this.runtimes.has(id)) {
      this.runtimes.set(id, {
        taskId: id,
        mode,
        pipeline: null,
        selectedStepId: null,
        terminalBuffers: {},
        stepApprovals: {},
        autoApproved: {},
        loadState: 'idle',
        error: null,
        diffFiles: null,
        diffLoading: false,
        pollActive: false,
        stopping: false,
        rollingBack: false,
        forking: false,
        merging: false,
        mergeEvents: [],
        timelineExtras: { mergeEvents: [] },
      });
    }
    const rt = this.runtimes.get(id);
    rt.mode = mode;
    return rt;
  }

  _initWsOnce() {
    if (this.wsInitialized) return;
    this.wsInitialized = true;
    engineClient.connect();
    for (const type of PIPELINE_WS_EVENTS) {
      engineClient.on(type, (data) => {
        const tid = data?.task_id ?? data?.taskId;
        if (!tid) return;
        this.applyWsEvent(String(tid), type, data);
      });
    }
  }

  async mount(taskId, mode = 'live') {
    const id = String(taskId);
    this._initWsOnce();
    const rt = this._ensureRuntime(id, mode);
    rt.loadState = 'loading';
    this._notify();

    try {
      await engineTaskStore.fetchTaskDetail(id);
      await this.refreshFromHttp(id);
      if (mode === 'live') {
        this.startPoll(id);
      }
      rt.loadState = rt.pipeline ? 'ready' : 'not_found';
    } catch (err) {
      rt.loadState = 'error';
      rt.error = err instanceof Error ? err.message : String(err);
    }
    this._notify();
    await this.refreshPendingApprovals();
  }

  unmount(taskId) {
    this.stopPoll(taskId);
  }

  selectStep(taskId, stepId) {
    const rt = this.runtimes.get(String(taskId));
    if (!rt) return;
    rt.selectedStepId = stepId;
    this._notify();
  }

  async refreshFromHttp(taskId) {
    const id = String(taskId);
    const rt = this._ensureRuntime(id);
    let payload;
    try {
      payload = await engineClient.fetchTaskById(id);
    } catch (err) {
      const meta = await engineClient.fetchTaskDetail(id).catch(() => null);
      if (meta?.ok && meta.payload) payload = meta.payload;
      else throw err;
    }

    const raw = unwrapEngineTaskPayload(payload) || payload;
    if (!raw) {
      rt.pipeline = null;
      return;
    }

    const derived = derivePipeline({ task: raw }, { mode: rt.mode });
    if (derived) {
      derived.steps = derived.steps.map((s) => {
        const buf = rt.terminalBuffers[s.id];
        const evidence = [...(s.evidence || [])];
        if (buf) {
          const hasTerm = evidence.some((e) => e.type === 'terminal');
          if (!hasTerm) {
            evidence.push({ type: 'terminal', ref: `local://${s.id}`, label: 'Terminal' });
          }
        }
        const approval = rt.stepApprovals[s.id];
        const auto = rt.autoApproved[s.id];
        return {
          ...s,
          evidence,
          ...(approval ? { _approval: approval } : {}),
          ...(auto ? { _autoApproved: auto } : {}),
        };
      });
      rt.pipeline = derived;
      if (!rt.selectedStepId && derived.steps.length) {
        const running = derived.steps.find((s) => s.status === 'running');
        rt.selectedStepId = running?.id ?? derived.steps[derived.steps.length - 1]?.id;
      }
      if (isTerminalEngineStatus(mapEngineStatus(derived.status))) {
        this.loadDiff(id).catch(() => {});
      }
    }
    this._notify();
  }

  startPoll(taskId) {
    const id = String(taskId);
    const rt = this._ensureRuntime(id);
    if (rt.pollActive) return;
    rt.pollActive = true;
    this._pollLoop(id);
  }

  stopPoll(taskId) {
    const rt = this.runtimes.get(String(taskId));
    if (rt) rt.pollActive = false;
  }

  async _pollLoop(taskId) {
    const id = String(taskId);
    while (this.runtimes.get(id)?.pollActive) {
      try {
        await this.refreshFromHttp(id);
        const status = mapEngineStatus(this.runtimes.get(id)?.pipeline?.status);
        if (isTerminalEngineStatus(status)) {
          this.runtimes.get(id).pollActive = false;
          break;
        }
      } catch {
        // keep polling on WS disconnect
      }
      await sleep(RUN_POLL_MS);
    }
  }

  applyWsEvent(taskId, type, data) {
    const id = String(taskId);
    const rt = this.runtimes.get(id);
    if (!rt?.pipeline) {
      if (['task_started', 'step_started'].includes(type)) {
        this.refreshFromHttp(id).catch(() => {});
      }
      return;
    }

    const steps = [...rt.pipeline.steps];
    const stepId = data?.step_id ?? data?.stepId;
    const idx = findStepIndex(steps, stepId, data?.index);

    const patchStep = (i, patch) => {
      if (i < 0 || i >= steps.length) return;
      steps[i] = { ...steps[i], ...patch };
    };

    switch (type) {
      case 'step_started':
        if (idx >= 0) {
          patchStep(idx, { status: 'running' });
          rt.selectedStepId = steps[idx].id;
        }
        break;
      case 'step_completed':
        if (idx >= 0) patchStep(idx, { status: 'passed' });
        break;
      case 'step_failed':
        if (idx >= 0) patchStep(idx, { status: 'failed' });
        break;
      case 'terminal_output': {
        const sid = stepId || (idx >= 0 ? steps[idx].id : null);
        if (!sid) break;
        const chunk = data.chunk ?? data.output ?? data.text ?? '';
        rt.terminalBuffers[sid] = (rt.terminalBuffers[sid] || '') + String(chunk);
        if (idx >= 0) {
          const ev = [...(steps[idx].evidence || [])];
          if (!ev.some((e) => e.type === 'terminal')) {
            ev.push({ type: 'terminal', ref: `stream://${sid}`, label: 'Terminal' });
          }
          patchStep(idx, { evidence: ev });
        }
        break;
      }
      case 'browser_action': {
        if (idx < 0) break;
        const ref = data.screenshot_ref ?? data.screenshot ?? data.image;
        if (ref) {
          const ev = [...(steps[idx].evidence || [])];
          ev.push({ type: 'screenshot', ref: String(ref), label: data.action || 'Browser' });
          patchStep(idx, { evidence: ev });
        }
        break;
      }
      case 'verification_result':
        if (idx >= 0) {
          patchStep(idx, {
            verification: {
              ...steps[idx].verification,
              result: data.result,
              detail: data.detail ?? steps[idx].verification?.detail,
            },
          });
        }
        break;
      case 'approval_required':
        if (idx >= 0) {
          patchStep(idx, { status: 'awaiting_approval' });
          rt.stepApprovals[steps[idx].id] = {
            id: data.approval_id ?? data.id,
            task_id: id,
            step_id: steps[idx].id,
            action: data.action ?? '',
            risk: data.risk ?? 'high',
            reason: data.reason ?? '',
            expected_impact: data.expected_impact ?? {},
          };
          rt.selectedStepId = steps[idx].id;
        }
        rt.pipeline = { ...rt.pipeline, status: 'awaiting_approval' };
        this.refreshPendingApprovals().catch(() => {});
        break;
      case 'approval_resolved':
        if (idx >= 0) {
          patchStep(idx, {
            status: data.approved ? 'running' : 'failed',
          });
          delete rt.stepApprovals[steps[idx].id];
        }
        this.refreshPendingApprovals().catch(() => {});
        break;
      case 'auto_approved':
        if (idx >= 0) {
          rt.autoApproved[steps[idx].id] = data.rule ?? 'low risk';
        }
        break;
      case 'checkpoint_created':
        if (idx >= 0) {
          patchStep(idx, { checkpointId: data.checkpoint_id ?? data.checkpointId });
        }
        break;
      case 'task_completed':
      case 'completed':
      case 'task_finished': {
        const answer = extractTaskAnswer(data);
        rt.pipeline = {
          ...rt.pipeline,
          status: 'completed',
          verification_summary: data.verification_summary ?? rt.pipeline.verification_summary,
          steps,
          ...(answer ? { answer } : {}),
        };
        rt.pollActive = false;
        this.loadDiff(id).catch(() => {});
        this._notify();
        return;
      }
      case 'task_failed':
        rt.pipeline = { ...rt.pipeline, status: 'failed', steps };
        rt.pollActive = false;
        this._notify();
        return;
      case 'task_started':
        rt.pipeline = { ...rt.pipeline, status: 'running' };
        break;
      case 'fork_started': {
        const forkId = data.fork_id ?? data.forkId;
        if (!forkId) break;
        const forks = [...(rt.pipeline.forks || [])];
        if (!forks.some((f) => f.id === String(forkId))) {
          forks.push(
            deriveFork(
              {
                id: forkId,
                fork_id: forkId,
                task_id: id,
                strategy: data.strategy ?? 'fork',
                pipeline: { steps: [], status: 'running' },
              },
              id,
            ),
          );
        }
        rt.pipeline = { ...rt.pipeline, forks };
        break;
      }
      case 'fork_step_started':
      case 'fork_step_completed': {
        const forkId = data.fork_id ?? data.forkId;
        const forks = [...(rt.pipeline.forks || [])];
        const fi = forks.findIndex((f) => f.id === String(forkId));
        if (fi < 0) break;
        const fSteps = [...(forks[fi].pipeline?.steps || [])];
        const fIdx = findStepIndex(fSteps, stepId, data?.index);
        if (fIdx >= 0) {
          fSteps[fIdx] = {
            ...fSteps[fIdx],
            status: type === 'fork_step_started' ? 'running' : 'passed',
          };
        }
        forks[fi] = {
          ...forks[fi],
          pipeline: { ...forks[fi].pipeline, steps: fSteps },
        };
        rt.pipeline = { ...rt.pipeline, forks };
        break;
      }
      case 'fork_completed': {
        const forkId = data.fork_id ?? data.forkId;
        const forks = (rt.pipeline.forks || []).map((f) =>
          f.id === String(forkId)
            ? { ...f, pipeline: { ...f.pipeline, status: 'completed' } }
            : f,
        );
        rt.pipeline = { ...rt.pipeline, forks };
        break;
      }
      case 'fork_scored': {
        const forkId = data.fork_id ?? data.forkId;
        const score = Number(data.score);
        const forks = (rt.pipeline.forks || []).map((f) =>
          f.id === String(forkId) ? { ...f, score } : f,
        );
        const max = Math.max(...forks.map((f) => f.score ?? -Infinity));
        rt.pipeline = {
          ...rt.pipeline,
          forks: forks.map((f) => ({ ...f, isWinner: f.score === max && max > -Infinity })),
        };
        break;
      }
      case 'merge_completed': {
        const ev = { fork_id: data.fork_id ?? data.forkId, ts: Date.now() };
        rt.mergeEvents = [...(rt.mergeEvents || []), ev];
        rt.timelineExtras = { mergeEvents: rt.mergeEvents };
        break;
      }
      default:
        break;
    }

    if (type !== 'task_completed' && type !== 'task_failed') {
      rt.pipeline = { ...rt.pipeline, steps };
      this._notify();
    }
  }

  async loadDiff(taskId) {
    const rt = this.runtimes.get(String(taskId));
    if (!rt) return;
    rt.diffLoading = true;
    this._notify();
    try {
      const res = await engineClient.fetchTaskDiff(taskId);
      const files = (res?.files || [])
        .map((f) => ({
          path: sanitizeDiffPath(f.path),
          patch: f.patch ?? '',
        }))
        .filter((f) => f.path);
      rt.diffFiles = files;
    } catch {
      rt.diffFiles = [];
    } finally {
      rt.diffLoading = false;
      this._notify();
    }
  }

  async stopTask(taskId) {
    const rt = this._ensureRuntime(taskId);
    rt.stopping = true;
    this._notify();
    try {
      await engineClient.stopTask(taskId);
      rt.pipeline = rt.pipeline ? { ...rt.pipeline, status: 'cancelled' } : rt.pipeline;
      rt.pollActive = false;
    } finally {
      rt.stopping = false;
      this._notify();
      await this.refreshFromHttp(taskId);
    }
  }

  async rollback(taskId, checkpointId) {
    const rt = this._ensureRuntime(taskId);
    rt.rollingBack = true;
    this._notify();
    try {
      await engineClient.rollbackTask(taskId, checkpointId);
      await this.refreshFromHttp(taskId);
    } finally {
      rt.rollingBack = false;
      this._notify();
    }
  }

  async resolveApproval(approvalId, approved, feedback = '') {
    await engineClient.approveViaAPI(approvalId, approved, feedback);
    await this.refreshPendingApprovals();
  }

  async refreshPendingApprovals() {
    try {
      const res = await engineClient.getApprovals();
      const list = Array.isArray(res) ? res : res?.approvals || [];
      this.pendingApprovalsCount = list.filter(
        (a) => (a.status || 'pending') === 'pending',
      ).length;
    } catch {
      // keep last count
    }
    this._notify();
  }

  screenshotUrl(taskId, stepId) {
    const base = ENGINE_BASE_URL.replace(/\/$/, '');
    return `${base}/api/screenshot?task=${encodeURIComponent(taskId)}&step=${encodeURIComponent(stepId)}&t=${Date.now()}`;
  }

  async startFork(taskId, strategies) {
    const rt = this._ensureRuntime(taskId);
    rt.forking = true;
    this._notify();
    try {
      const res = await engineClient.forkTask(taskId, strategies);
      await this.refreshFromHttp(taskId);
      return res;
    } finally {
      rt.forking = false;
      this._notify();
    }
  }

  async mergeFork(taskId, forkId) {
    const rt = this._ensureRuntime(taskId);
    rt.merging = true;
    this._notify();
    try {
      await engineClient.mergeFork(taskId, forkId);
      await this.refreshFromHttp(taskId);
      await this.loadDiff(taskId);
    } finally {
      rt.merging = false;
      this._notify();
    }
  }

  getTimelineExtras(taskId) {
    const rt = this.runtimes.get(String(taskId));
    return rt?.timelineExtras || { mergeEvents: [] };
  }
}

export const pipelineRuntimeStore = new PipelineRuntimeStore();
export { RUN_POLL_MS, sanitizeDiffPath };
