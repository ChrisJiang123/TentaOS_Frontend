// @ts-nocheck
import { ENGINE_URL, WS_URL, RUNTIME_CONFIG } from '@/lib/runtimeConfig';

const MAX_LOG = 200;

function pickIds(payload) {
  const p = payload && typeof payload === 'object' ? payload : {};
  return {
    request_id: p.request_id ?? p.requestId ?? null,
    task_id: p.task_id ?? p.taskId ?? p.id ?? null,
    pipeline_id: p.pipeline_id ?? p.pipelineId ?? null,
  };
}

class RuntimeDebugStore {
  constructor() {
    this.listeners = new Set();
    this.logs = [];
    this.backendHttpOk = null;
    this.backendHttpError = null;
    this.backendHttpAt = null;
    this.wsState = 'disconnected';
    this.lastWsEvent = null;
    this.ids = { request_id: null, task_id: null, pipeline_id: null };
    this.pipelineStage = 'idle';
    this.streaming = false;
    this.lastError = null;
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
        console.error('runtimeDebug listener error', e);
      }
    });
  }

  getSnapshot() {
    return {
      config: RUNTIME_CONFIG,
      engineUrl: ENGINE_URL,
      wsUrl: WS_URL,
      backendHttpOk: this.backendHttpOk,
      backendHttpError: this.backendHttpError,
      backendHttpAt: this.backendHttpAt,
      wsState: this.wsState,
      ids: { ...this.ids },
      pipelineStage: this.pipelineStage,
      streaming: this.streaming,
      lastError: this.lastError,
      lastWsEvent: this.lastWsEvent,
      logs: [...this.logs],
    };
  }

  _push(entry) {
    this.logs = [{ ...entry, ts: Date.now() }, ...this.logs].slice(0, MAX_LOG);
    this._notify();
  }

  setWsState(state) {
    this.wsState = state;
    this._push({ kind: 'ws', level: 'info', message: `WebSocket: ${state}` });
  }

  setBackendHttp(ok, error = null) {
    this.backendHttpOk = ok;
    this.backendHttpError = error;
    this.backendHttpAt = Date.now();
    this._push({
      kind: 'http',
      level: ok ? 'info' : 'error',
      message: ok ? 'Backend HTTP reachable (/api/health)' : `Backend HTTP unreachable: ${error}`,
    });
  }

  setPipelineStage(stage, payload = null) {
    this.pipelineStage = stage;
    if (payload) {
      const ids = pickIds(payload);
      if (ids.request_id) this.ids.request_id = ids.request_id;
      if (ids.task_id) this.ids.task_id = ids.task_id;
      if (ids.pipeline_id) this.ids.pipeline_id = ids.pipeline_id;
    }
    this._notify();
  }

  setStreaming(on) {
    this.streaming = Boolean(on);
    this._notify();
  }

  setError(err, context = '') {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : null;
    this.lastError = { message: msg, stack, context, at: Date.now() };
    this._push({
      kind: 'error',
      level: 'error',
      message: context ? `${context}: ${msg}` : msg,
      detail: stack,
    });
  }

  logApiSent({ method, path, requestId, body }) {
    this._push({
      kind: 'api',
      level: 'info',
      message: `API → ${method} ${path}`,
      request_id: requestId,
      detail: body ? JSON.stringify(body).slice(0, 500) : undefined,
    });
    this.ids.request_id = requestId;
    this._notify();
  }

  logApiResponse({ method, path, requestId, status, payload, ms }) {
    const ids = pickIds(payload);
    if (ids.request_id) this.ids.request_id = ids.request_id;
    if (ids.task_id) this.ids.task_id = ids.task_id;
    if (ids.pipeline_id) this.ids.pipeline_id = ids.pipeline_id;
    this._push({
      kind: 'api',
      level: status >= 400 ? 'error' : 'info',
      message: `API ← ${method} ${path} ${status} (${ms}ms)`,
      request_id: requestId,
      task_id: ids.task_id,
      pipeline_id: ids.pipeline_id,
      detail: payload ? JSON.stringify(payload).slice(0, 800) : undefined,
    });
    this._notify();
  }

  logWsEvent(eventType, data) {
    this.lastWsEvent = { type: eventType, at: Date.now() };
    const ids = pickIds(data);
    if (ids.request_id) this.ids.request_id = ids.request_id;
    if (ids.task_id) this.ids.task_id = ids.task_id;
    if (ids.pipeline_id) this.ids.pipeline_id = ids.pipeline_id;
    if (eventType === 'llm_streaming') this.setStreaming(true);
    if (eventType === 'completed' || eventType === 'failed' || eventType === 'task_completed') {
      this.setStreaming(false);
    }
    this._push({
      kind: 'ws',
      level: eventType === 'failed' ? 'error' : 'info',
      message: `WS event: ${eventType}`,
      task_id: ids.task_id,
      pipeline_id: ids.pipeline_id,
      detail: data ? JSON.stringify(data).slice(0, 600) : undefined,
    });
  }

  clearLogs() {
    this.logs = [];
    this._notify();
  }
}

export const runtimeDebug = new RuntimeDebugStore();

export function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
