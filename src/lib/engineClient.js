// @ts-nocheck
import { ENGINE_URL, WS_URL } from '@/config';

const ENGINE_BASE_URL = ENGINE_URL;
const ENGINE_WS_URL = WS_URL;

class TentaOSClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.connected = false;
    this.reconnectTimer = null;
    this.manualClose = false;
    this.state = 'disconnected'; // disconnected | connecting | connected | reconnecting | failed
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
    // Exponential backoff with jitter, bounded.
    const base = 1000; // 1s
    const max = 30000; // 30s
    const exp = Math.min(max, Math.round(base * Math.pow(1.8, this.reconnectAttempt)));
    const jitter = Math.round(exp * (0.2 * Math.random())); // up to +20%
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
        console.error("WS parse error:", error);
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
      console.error("WS error:", error);
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
      try { fn(data); } catch (error) { console.error(`Listener error for ${type}:`, error); }
    });
  }

  async request(path, options = {}) {
    const { timeoutMs = 10_000, ...fetchOpts } = options;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(`${ENGINE_BASE_URL.replace(/\/$/, "")}${path}`, {
        ...fetchOpts,
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(t);
    }
    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }
    if (!response.ok) throw new Error(payload?.error || payload?.message || `Request failed: ${response.status}`);
    return payload;
  }

  async submitTask(message) {
    return this.request("/api/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  }

  async getTask(taskId) {
    return this.request(`/api/task/${encodeURIComponent(taskId)}`);
  }

  async getHealth() {
    return this.request("/api/health");
  }

  async getApprovals() {
    return this.request("/api/approvals");
  }

  async approveViaAPI(approvalId, approved, feedback = "") {
    return this.request(`/api/approvals/${encodeURIComponent(approvalId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, feedback }),
    });
  }

  async stopAll() {
    return this.request("/api/stop", { method: "POST" });
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
