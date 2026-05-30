// @ts-nocheck
/**
 * Single source of truth for Engine tasks (backend task IDs only).
 * All list/detail reads use no-cache HTTP; polling is source-of-truth for status.
 */
import engineClient, { ENGINE_BASE_URL } from '@/lib/engineClient';
import { ENGINE_PATHS } from '@/lib/engineApiPaths';
import { pipelineRunStore } from '@/lib/pipelineRunStore';
import {
  extractTaskId,
  extractTaskList,
  unwrapEngineTaskPayload,
  normalizeEngineTask,
  parseTaskIdFromSubmitResponse,
  mapEngineStatus,
  isTerminalEngineStatus,
  isActiveEngineStatus,
} from '@/lib/engineTaskUtils';

const POLL_INTERVAL_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logDebug(label, data) {
  if (import.meta.env.DEV) {
    console.log(`[engineTaskStore] ${label}`, data);
  }
}

class EngineTaskStore {
  constructor() {
    /** @type {Map<string, object>} backend taskId -> record */
    this.tasks = new Map();
    this.listeners = new Set();
    this.activePolls = new Set();
    this.listDebug = {
      listUrl: '',
      httpStatus: null,
      lastFetchAt: null,
      error: null,
      loading: false,
    };
    this.activeRunTaskId = null;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => this.listeners.delete(fn);
  }

  _notify() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => {
      try {
        fn(snap);
      } catch (e) {
        console.error('engineTaskStore listener', e);
      }
    });
  }

  getSnapshot() {
    const tasks = this.getTaskList();
    return {
      tasks,
      taskById: Object.fromEntries(
        [...this.tasks.entries()].map(([id, rec]) => [id, rec.normalized]),
      ),
      listDebug: { ...this.listDebug },
      debug: this.getGlobalDebug(),
      activeRunTaskId: this.activeRunTaskId,
    };
  }

  getGlobalDebug() {
    const first = [...this.tasks.values()][0];
    return {
      engineBaseUrl: ENGINE_BASE_URL,
      listApiUrl: this.listDebug.listUrl,
      listHttpStatus: this.listDebug.httpStatus,
      listLastFetchAt: this.listDebug.lastFetchAt,
      listError: this.listDebug.error,
      taskCount: this.tasks.size,
      activePolls: [...this.activePolls],
      sampleTaskId: first?.id ?? null,
    };
  }

  getTaskRecord(taskId) {
    return this.tasks.get(String(taskId)) || null;
  }

  getTaskList() {
    return [...this.tasks.values()]
      .map((rec) => rec.normalized)
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }

  _upsertRecord(taskId, partial) {
    const id = String(taskId);
    const prev = this.tasks.get(id) || {
      id,
      payload: null,
      raw: null,
      normalized: null,
      detailUrl: `${ENGINE_BASE_URL.replace(/\/$/, '')}${ENGINE_PATHS.taskById(id)}`,
      httpStatus: null,
      lastPollAt: null,
      pollError: null,
    };
    const next = { ...prev, ...partial, id };
    if (partial.payload != null) {
      next.raw = unwrapEngineTaskPayload(partial.payload);
      next.normalized = normalizeEngineTask(partial.payload, { taskId: id });
    }
    this.tasks.set(id, next);
    logDebug('upsert', {
      taskId: id,
      status: next.raw?.status,
      steps: next.raw?.pipeline?.steps?.length ?? 0,
      output: Boolean(next.raw?.output),
    });
    this._notify();
    return next;
  }

  /** Load GET /api/tasks and merge into store. */
  async refreshList() {
    const isInitialLoad = !this.listDebug.lastFetchAt;
    if (isInitialLoad) {
      this.listDebug = { ...this.listDebug, loading: true, error: null };
      this._notify();
    }

    try {
      const meta = await engineClient.fetchTasksList();
      this.listDebug = {
        listUrl: meta.url,
        httpStatus: meta.httpStatus,
        lastFetchAt: Date.now(),
        error: meta.ok ? null : meta.error,
        loading: false,
      };

      logDebug('refreshList', {
        url: meta.url,
        httpStatus: meta.httpStatus,
        count: extractTaskList(meta.payload).length,
      });

      if (!meta.ok) {
        this._notify();
        return meta;
      }

      const items = extractTaskList(meta.payload);
      for (const item of items) {
        const raw = unwrapEngineTaskPayload(item) || item;
        const id = extractTaskId(raw) || extractTaskId(item);
        if (!id) continue;

        this._upsertRecord(id, {
          payload: { ok: true, task: raw },
          httpStatus: meta.httpStatus,
          lastPollAt: Date.now(),
          pollError: null,
        });

        if (this.activeRunTaskId === id) {
          pipelineRunStore.syncFromTask(raw);
        }
        if (isActiveEngineStatus(mapEngineStatus(raw?.status))) {
          this.startPoll(id);
        }
      }

      this._notify();
      return meta;
    } catch (err) {
      this.listDebug = {
        ...this.listDebug,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
        lastFetchAt: Date.now(),
      };
      this._notify();
      throw err;
    }
  }

  /** GET /api/tasks/:id immediately after submit or on TaskDetail mount. */
  async fetchTaskDetail(taskId) {
    const id = String(taskId);
    try {
      const meta = await engineClient.fetchTaskDetail(id);
      logDebug('fetchTaskDetail', {
        taskId: id,
        url: meta.url,
        httpStatus: meta.httpStatus,
        ok: meta.ok,
        status: unwrapEngineTaskPayload(meta.payload)?.status,
      });

      if (meta.ok && meta.payload) {
        this._upsertRecord(id, {
          payload: meta.payload,
          detailUrl: meta.url,
          httpStatus: meta.httpStatus,
          lastPollAt: Date.now(),
          pollError: null,
        });
        const raw = unwrapEngineTaskPayload(meta.payload);
        if (raw) pipelineRunStore.syncFromTask(raw);
      } else {
        this._upsertRecord(id, {
          detailUrl: meta.url,
          httpStatus: meta.httpStatus,
          lastPollAt: Date.now(),
          pollError: meta.error || 'Task not found or expired',
        });
      }
      return meta;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._upsertRecord(id, {
        lastPollAt: Date.now(),
        pollError: msg,
        httpStatus: err?.httpStatus ?? 0,
      });
      pipelineRunStore.notePollError(err);
      throw err;
    }
  }

  /** After POST /api/task — register backend id, fetch detail, start poll. */
  async registerSubmittedTask(submitPayload, options = {}) {
    const taskId = parseTaskIdFromSubmitResponse(submitPayload);
    if (!taskId) {
      logDebug('registerSubmittedTask:missingId', submitPayload);
      return null;
    }

    const id = String(taskId);
    this.activeRunTaskId = id;

    this._upsertRecord(id, {
      payload: submitPayload.task ? { ok: true, ...submitPayload } : { ok: true, task_id: id, ...submitPayload },
      lastPollAt: Date.now(),
      pollError: null,
    });

    await this.fetchTaskDetail(id);
    this.startPoll(id);
    return id;
  }

  async ensureTaskLoaded(taskId) {
    const id = String(taskId);
    let rec = this.tasks.get(id);
    if (!rec?.raw || rec.pollError) {
      await this.fetchTaskDetail(id);
    }
    rec = this.tasks.get(id);
    const raw = rec?.raw;
    if (raw && isActiveEngineStatus(mapEngineStatus(raw.status))) {
      this.startPoll(id);
    }
    return rec;
  }

  startPoll(taskId) {
    const id = String(taskId);
    if (!id || this.activePolls.has(id)) return;
    this.activePolls.add(id);
    this._pollLoop(id);
  }

  stopPoll(taskId) {
    this.activePolls.delete(String(taskId));
  }

  async _pollLoop(taskId) {
    const id = String(taskId);
    try {
      while (this.activePolls.has(id)) {
        try {
          await this.fetchTaskDetail(id);
          const raw = this.tasks.get(id)?.raw;
          if (raw && this.activeRunTaskId === id) {
            pipelineRunStore.syncFromTask(raw);
          }
          const status = mapEngineStatus(raw?.status);
          if (isTerminalEngineStatus(status)) {
            this.activePolls.delete(id);
            if (status === 'completed' && this.activeRunTaskId === id) {
              pipelineRunStore.syncFromTask(raw);
            }
            break;
          }
        } catch (err) {
          pipelineRunStore.notePollError(err);
        }
        await sleep(POLL_INTERVAL_MS);
      }
    } finally {
      this.activePolls.delete(id);
    }
  }
}

export const engineTaskStore = new EngineTaskStore();
export { POLL_INTERVAL_MS };
