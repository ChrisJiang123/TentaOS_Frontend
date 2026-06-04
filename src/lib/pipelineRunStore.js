// @ts-nocheck
import { runtimeDebug } from '@/lib/runtimeDebug';
import { mapEngineStatus } from '@/lib/engineTaskUtils';

/** User-visible run phases (demo-friendly). */
export const RUN_PHASES = {
  idle: { label: 'Ready', order: 0 },
  sending: { label: 'Sending request...', order: 1 },
  backend_received: { label: 'Backend received', order: 2 },
  pipeline_started: { label: 'Pipeline started', order: 3 },
  planner_running: { label: 'Planner running', order: 4 },
  tool_selected: { label: 'Tool selected', order: 5 },
  tool_running: { label: 'Tool running', order: 6 },
  tool_finished: { label: 'Tool finished', order: 7 },
  llm_streaming: { label: 'Generating response', order: 8 },
  completed: { label: 'Completed', order: 9 },
  failed: { label: 'Failed', order: 10 },
};

import { PIPELINE_WS_EVENTS } from './pipelineWsEvents.js';

export { PIPELINE_WS_EVENTS };

const EVENT_TO_PHASE = {
  pipeline_started: 'pipeline_started',
  planner_running: 'planner_running',
  tool_selected: 'tool_selected',
  tool_running: 'tool_running',
  tool_finished: 'tool_finished',
  llm_streaming: 'llm_streaming',
  completed: 'completed',
  failed: 'failed',
  task_finished: 'completed',
  task_started: 'pipeline_started',
  task_completed: 'completed',
  step_started: 'tool_running',
  step_completed: 'tool_finished',
};

class PipelineRunStore {
  constructor() {
    this.listeners = new Set();
    this.phase = 'idle';
    this.error = null;
    this.taskId = null;
    this.requestId = null;
    this.pipelineId = null;
    this.message = '';
    this.lastEvent = null;
    this.startedAt = null;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => this.listeners.delete(fn);
  }

  _notify() {
    const s = this.getSnapshot();
    this.listeners.forEach((fn) => {
      try {
        fn(s);
      } catch (e) {
        console.error('pipelineRunStore listener', e);
      }
    });
  }

  getSnapshot() {
    return {
      phase: this.phase,
      label: RUN_PHASES[this.phase]?.label || this.phase,
      error: this.error,
      taskId: this.taskId,
      requestId: this.requestId,
      pipelineId: this.pipelineId,
      message: this.message,
      lastEvent: this.lastEvent,
      startedAt: this.startedAt,
    };
  }

  start(message, requestId) {
    this.phase = 'sending';
    this.error = null;
    this.message = message;
    this.requestId = requestId;
    this.taskId = null;
    this.pipelineId = null;
    this.lastEvent = null;
    this.startedAt = Date.now();
    runtimeDebug.setPipelineStage('sending');
    this._notify();
  }

  markBackendReceived(payload, requestId) {
    this.phase = 'backend_received';
    const rid = payload?.request_id ?? payload?.requestId ?? requestId;
    if (rid) this.requestId = String(rid);
    const tid =
      payload?.task_id ??
      payload?.taskId ??
      payload?.id ??
      payload?.task?.task_id ??
      payload?.task?.taskId ??
      payload?.task?.id;
    if (tid) this.taskId = String(tid);
    const pid = payload?.pipeline_id ?? payload?.pipelineId;
    if (pid) this.pipelineId = String(pid);
    runtimeDebug.setPipelineStage('backend_received', payload);
    this._notify();
  }

  /** HTTP poll source-of-truth: derive chip phase from task.status only. */
  syncFromTask(task) {
    if (!task || typeof task !== 'object') return;
    const tid = task.task_id ?? task.taskId ?? task.id;
    if (tid) this.taskId = String(tid);
    if (task.pipeline_id) this.pipelineId = String(task.pipeline_id);

    const mapped = mapEngineStatus(task.status);

    if (mapped === 'completed') {
      this.phase = 'completed';
      this.error = null;
      this.lastEvent = { type: 'http_poll', data: task, at: Date.now() };
      runtimeDebug.setPipelineStage('completed', task);
      this._notify();
      return;
    }

    if (mapped === 'failed' || mapped === 'cancelled') {
      this.phase = 'failed';
      const errMsg = task?.error ?? task?.message ?? 'Task failed';
      this.error = { message: String(errMsg), at: Date.now() };
      this.lastEvent = { type: 'http_poll', data: task, at: Date.now() };
      runtimeDebug.setPipelineStage('failed', task);
      this._notify();
      return;
    }

    const statusToPhase = {
      queued: 'backend_received',
      planning: 'pipeline_started',
      running: 'tool_running',
      awaiting_approval: 'tool_selected',
      paused: 'tool_running',
    };
    const nextPhase = statusToPhase[mapped] || 'backend_received';
    this.phase = nextPhase;
    this.lastEvent = { type: 'http_poll', data: task, at: Date.now() };
    runtimeDebug.setPipelineStage(nextPhase, task);
    this._notify();
  }

  notePollError(err) {
    const msg = err instanceof Error ? err.message : String(err);
    this.lastEvent = { type: 'http_poll_error', data: { message: msg }, at: Date.now() };
    this._notify();
  }

  handleWsEvent(eventType, data) {
    const mapped = EVENT_TO_PHASE[eventType] || null;
    if (mapped) {
      this.phase = mapped;
      this.lastEvent = { type: eventType, data, at: Date.now() };
      if (data?.task_id) this.taskId = String(data.task_id);
      if (data?.taskId) this.taskId = String(data.taskId);
      if (data?.pipeline_id) this.pipelineId = String(data.pipeline_id);
      runtimeDebug.setPipelineStage(mapped, data);
      if (mapped === 'failed') {
        const errMsg = data?.error ?? data?.message ?? 'Pipeline failed';
        this.error = { message: String(errMsg), at: Date.now() };
        runtimeDebug.setError(new Error(String(errMsg)), eventType);
      }
      this._notify();
    }
  }

  fail(err) {
    this.phase = 'failed';
    const msg = err instanceof Error ? err.message : String(err);
    this.error = { message: msg, stack: err instanceof Error ? err.stack : null, at: Date.now() };
    runtimeDebug.setPipelineStage('failed');
    runtimeDebug.setError(err, 'submit');
    this._notify();
  }

  reset() {
    this.phase = 'idle';
    this.error = null;
    this.taskId = null;
    this.requestId = null;
    this.pipelineId = null;
    this.message = '';
    this.lastEvent = null;
    this.startedAt = null;
    runtimeDebug.setPipelineStage('idle');
    this._notify();
  }
}

export const pipelineRunStore = new PipelineRunStore();
