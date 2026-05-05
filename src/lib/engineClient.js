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
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.manualClose = false;
    this.ws = new WebSocket(ENGINE_WS_URL);

    this.ws.onopen = () => {
      this.connected = true;
      this.emit("connection_status", { connected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data?.type || data?.event;
        if (eventType) {
          this.emit(eventType, data);
        }
      } catch (error) {
        console.error("WS parse error:", error);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.emit("connection_status", { connected: false });
      if (!this.manualClose) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WS error:", error);
    };
  }

  disconnect() {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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
    const response = await fetch(`${ENGINE_BASE_URL.replace(/\/$/, "")}${path}`, options);
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
}

const engineClient = new TentaOSClient();
export default engineClient;
export { ENGINE_BASE_URL, ENGINE_WS_URL, TentaOSClient };
