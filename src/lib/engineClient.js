// @ts-nocheck
import { ENGINE_URL, WS_URL } from '@/lib/runtimeConfig';
import { runtimeDebug, createRequestId } from '@/lib/runtimeDebug';
import { pipelineRunStore, PIPELINE_WS_EVENTS } from '@/lib/pipelineRunStore';

const ENGINE_BASE_URL = ENGINE_URL;
const ENGINE_WS_URL = WS_URL;

let healthPollTimer = null;

function startHealthPoll(client) {
  if (healthPollTimer) return;
  const poll = async () => {
    if (!ENGINE_BASE_URL) {
      runtimeDebug.setBackendHttp(false, 'ENGINE_URL not set');
      return;
    }
    try {
      const t0 = performance.now();
      const res = await fetch(`${ENGINE_BASE_URL.replace(/\/$/, '')}/api/health`, { method: 'GET' });
      const ms = Math.round(performance.now() - t0);
      const text = await res.text();
      let payload = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { raw: text };
      }
      runtimeDebug.logApiResponse({
        method: 'GET',
        path: '/api/health',
        requestId: 'health_poll',
        status: res.status,
        payload,
        ms,
      });
      runtimeDebug.setBackendHttp(res.ok, res.ok ? null : `HTTP ${res.status}`);
    } catch (e) {
      runtimeDebug.setBackendHttp(false, e instanceof Error ? e.message : String(e));
    }
  };
  poll();
  healthPollTimer = setInterval(poll, 10_000);
}

class TentaOSClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.connected = false;
    this.reconnectTimer = null;
    this.manualClose = false;
    this.state = 'disconnected';
    this.reconnectAttempt = 0;
    this.nextRetryAt = null;
    this.lastMessageAt = null;
    this.lastHeartbeatAt = null;
    this.lastError = null;
  }

  _setState(state, extra = {}) {
    this.state = state;
    this.connected = state === 'connected';
    runtimeDebug.setWsState(state);
    this.emit('connection_status', {
      connected: this.connected,
      state: this.state,
      reconnect_attempt: this.reconnectAttempt,
      next_retry_at: this.nextRetryAt,
      last_message_at: this.lastMessageAt,
      last_heartbeat_at: this.lastHeartbeatAt,
      last_error: this.lastError,
      ...extra,
    });
  }

  _clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  _computeBackoffMs() {
    const base = 1000;
    const max = 30000;
    const exp = Math.min(max, Math.round(base * Math.pow(1.8, this.reconnectAttempt)));
    const jitter = Math.round(exp * (0.2 * Math.random()));
    return Math.min(max, exp + jitter);
  }

  _handleWsPayload(data) {
    const eventType = data?.type || data?.event;
    if (!eventType) return;

    runtimeDebug.logWsEvent(eventType, data);

    if (PIPELINE_WS_EVENTS.includes(eventType)) {
      pipelineRunStore.handleWsEvent(eventType, data);
    }

    this.emit('ws_event', { type: eventType, data });
    this.emit(eventType, data);
  }

  connect() {
    if (!ENGINE_WS_URL) {
      this.lastError = 'WS_URL not configured';
      this._setState('failed');
      runtimeDebug.setError(new Error(this.lastError), 'websocket');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    startHealthPoll(this);

    this.manualClose = false;
    this._clearReconnectTimer();
    this.nextRetryAt = null;
    this._setState(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
    this.ws = new WebSocket(ENGINE_WS_URL);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.lastError = null;
      this._setState('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.lastMessageAt = Date.now();
        const eventType = data?.type || data?.event;
        if (eventType === 'heartbeat' || eventType === 'ping' || data?.heartbeat) {
          this.lastHeartbeatAt = this.lastMessageAt;
        }
        this._handleWsPayload(data);
      } catch (error) {
        console.error('WS parse error:', error);
        runtimeDebug.setError(error, 'ws_parse');
      }
    };

    this.ws.onclose = () => {
      if (!this.manualClose) {
        const delay = this._computeBackoffMs();
        this.reconnectAttempt += 1;
        this.nextRetryAt = Date.now() + delay;
        this._setState('reconnecting', { next_retry_in_ms: delay });
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      } else {
        this._setState('disconnected');
      }
    };

    this.ws.onerror = (error) => {
      this.lastError = String(error?.message || error || 'WebSocket error');
      this._setState(this.connected ? 'connected' : 'failed');
      runtimeDebug.setError(new Error(this.lastError), 'websocket');
      console.error('WS error:', error);
    };
  }

  disconnect() {
    this.manualClose = true;
    this._clearReconnectTimer();
    this.nextRetryAt = null;
    if (this.ws) {
      this.ws.close();
    }
  }

  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(handler);
    return () => {
      const handlers = this.listeners.get(type) || [];
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    };
  }

  emit(type, data) {
    const handlers = this.listeners.get(type) || [];
    handlers.forEach((fn) => {
      try {
        fn(data);
      } catch (error) {
        console.error(`Listener error for ${type}:`, error);
      }
    });
  }

  async request(path, options = {}) {
    const { timeoutMs = 30_000, requestId: optRequestId, ...fetchOpts } = options;
    const requestId = optRequestId || createRequestId();
    const method = (fetchOpts.method || 'GET').toUpperCase();
    let bodyPreview = null;
    if (fetchOpts.body) {
      try {
        bodyPreview = JSON.parse(fetchOpts.body);
      } catch {
        bodyPreview = fetchOpts.body;
      }
    }

    if (!ENGINE_BASE_URL) {
      const err = new Error('ENGINE_URL not configured — set VITE_ENGINE_URL in .env.local');
      runtimeDebug.setError(err, 'api');
      throw err;
    }

    runtimeDebug.logApiSent({ method, path, requestId, body: bodyPreview });

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const t0 = performance.now();
    let response;
    try {
      response = await fetch(`${ENGINE_BASE_URL.replace(/\/$/, '')}${path}`, {
        ...fetchOpts,
        signal: ctrl.signal,
      });
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      runtimeDebug.logApiResponse({
        method,
        path,
        requestId,
        status: 0,
        payload: { error: e instanceof Error ? e.message : String(e) },
        ms,
      });
      runtimeDebug.setError(e, `${method} ${path}`);
      throw e;
    } finally {
      clearTimeout(t);
    }

    const ms = Math.round(performance.now() - t0);
    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    runtimeDebug.logApiResponse({
      method,
      path,
      requestId,
      status: response.status,
      payload,
      ms,
    });

    if (!response.ok) {
      const err = new Error(payload?.error || payload?.message || `Request failed: ${response.status}`);
      runtimeDebug.setError(err, `${method} ${path}`);
      throw err;
    }

    if (response.ok && path !== '/api/health') {
      runtimeDebug.setBackendHttp(true, null);
    }

    return payload;
  }

  async submitTask(message, options = {}) {
    const requestId = options.requestId || createRequestId();
    return this.request('/api/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, request_id: requestId }),
      requestId,
      timeoutMs: options.timeoutMs ?? 60_000,
    });
  }

  async getTask(taskId) {
    return this.request(`/api/task/${encodeURIComponent(taskId)}`, { timeoutMs: 15_000 });
  }

  async getHealth() {
    return this.request('/api/health');
  }

  async getApprovals() {
    return this.request('/api/approvals');
  }

  async approveViaAPI(approvalId, approved, feedback = '') {
    return this.request(`/api/approvals/${encodeURIComponent(approvalId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, feedback }),
    });
  }

  async stopAll() {
    return this.request('/api/stop', { method: 'POST' });
  }

  isConnected() {
    return this.connected;
  }

  getConnectionInfo() {
    return {
      connected: this.connected,
      state: this.state,
      reconnect_attempt: this.reconnectAttempt,
      next_retry_at: this.nextRetryAt,
      last_message_at: this.lastMessageAt,
      last_heartbeat_at: this.lastHeartbeatAt,
      last_error: this.lastError,
      engine_url: ENGINE_BASE_URL,
      ws_url: ENGINE_WS_URL,
    };
  }
}

const engineClient = new TentaOSClient();
export default engineClient;
export { ENGINE_BASE_URL, ENGINE_WS_URL, TentaOSClient };
