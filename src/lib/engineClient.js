import { ENGINE_URL, WS_URL } from '@/config';
import { ENGINE_PATHS } from '@/lib/engineApiPaths';

const ENGINE_BASE_URL = ENGINE_URL;
const ENGINE_WS_URL = WS_URL;

const NO_CACHE_FETCH = {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
    'ngrok-skip-browser-warning': 'true',
  },
};

function buildUrl(path) {
  return `${ENGINE_BASE_URL.replace(/\/$/, '')}${path}`;
}

function bustPath(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}t=${Date.now()}`;
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

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
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
        const eventType = data?.type || data?.event;
        this.lastMessageAt = Date.now();
        if (eventType === 'heartbeat' || eventType === 'ping' || data?.heartbeat) {
          this.lastHeartbeatAt = this.lastMessageAt;
        }
        if (eventType) {
          this.emit(eventType, data);
        }
      } catch (error) {
        console.error('WS parse error:', error);
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
    const response = await fetch(buildUrl(path), {
      ...options,
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }
    if (!response.ok) {
      const err = new Error(payload?.error || payload?.message || `Request failed: ${response.status}`);
      err.httpStatus = response.status;
      err.payload = payload;
      throw err;
    }
    if (payload?.ok === false) {
      const err = new Error(payload?.error || payload?.message || 'Request failed');
      err.httpStatus = response.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  }

  async requestWithMeta(path, options = {}) {
    const url = buildUrl(path);
    const response = await fetch(url, {
      ...options,
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }
    const ok = response.ok && payload?.ok !== false;
    return {
      url,
      httpStatus: response.status,
      ok,
      payload,
      error: ok ? null : payload?.error || payload?.message || `HTTP ${response.status}`,
    };
  }

  /** GET /api/tasks — no-cache, cache-bust query param. */
  async fetchTasksList() {
    return this.requestWithMeta(bustPath(ENGINE_PATHS.TASKS_LIST), NO_CACHE_FETCH);
  }

  /** GET /api/tasks/:id — no-cache, cache-bust query param. */
  async fetchTaskDetail(taskId) {
    return this.requestWithMeta(bustPath(ENGINE_PATHS.taskById(taskId)), NO_CACHE_FETCH);
  }

  async submitTask(message) {
    return this.request(ENGINE_PATHS.TASK_SUBMIT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  }

  async listTasks() {
    const meta = await this.fetchTasksList();
    return meta.payload;
  }

  async getTask(taskId) {
    const meta = await this.fetchTaskDetail(taskId);
    if (!meta.ok) {
      const err = new Error(meta.error || 'Task fetch failed');
      err.httpStatus = meta.httpStatus;
      err.payload = meta.payload;
      throw err;
    }
    return meta.payload;
  }

  async getTaskDetail(taskId) {
    return this.fetchTaskDetail(taskId);
  }

  async getHealth() {
    return this.request(ENGINE_PATHS.HEALTH);
  }

  async getApprovals() {
    return this.request(ENGINE_PATHS.APPROVALS);
  }

  async approveViaAPI(approvalId, approved, feedback = '') {
    return this.request(ENGINE_PATHS.approvalById(approvalId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, feedback }),
    });
  }

  async stopAll() {
    return this.request(ENGINE_PATHS.STOP, { method: 'POST' });
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
export { ENGINE_BASE_URL, ENGINE_WS_URL, TentaOSClient, NO_CACHE_FETCH };
