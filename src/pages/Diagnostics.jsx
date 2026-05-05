import React, { useEffect, useMemo, useState } from 'react';
import { ENGINE_URL, WS_URL } from '@/config';
import engineClient from '@/lib/engineClient';
import { Activity, Wifi, Timer, AlertTriangle, Link2 } from 'lucide-react';

function fmtTime(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
}

export default function Diagnostics() {
  const [health, setHealth] = useState({ status: 'idle', code: null, latencyMs: null, payload: null, error: null, at: null });
  const [conn, setConn] = useState(engineClient.getConnectionInfo?.() || { state: 'disconnected' });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const unsub = engineClient.on('connection_status', (d) => {
      setConn((prev) => ({ ...prev, ...d, engine_url: ENGINE_URL, ws_url: WS_URL }));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const onErr = (e) => {
      setErrors((prev) => [
        { ts: Date.now(), msg: String(e?.message || e) },
        ...prev,
      ].slice(0, 20));
    };
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', (ev) => onErr(ev?.reason || ev));
    return () => {
      window.removeEventListener('error', onErr);
    };
  }, []);

  const pollHealth = async () => {
    const started = performance.now();
    try {
      const res = await fetch(`${ENGINE_URL.replace(/\/$/, '')}/api/health`, { method: 'GET' });
      const latencyMs = Math.round(performance.now() - started);
      const text = await res.text();
      let payload = null;
      try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
      setHealth({ status: res.ok ? 'ok' : 'bad', code: res.status, latencyMs, payload, error: null, at: Date.now() });
    } catch (e) {
      const latencyMs = Math.round(performance.now() - started);
      setHealth({ status: 'error', code: null, latencyMs, payload: null, error: String(e?.message || e), at: Date.now() });
    }
  };

  useEffect(() => {
    pollHealth();
    const t = setInterval(pollHealth, 10_000); // >= 5s, keep it gentle
    return () => clearInterval(t);
  }, []);

  const lastWsMsg = conn.last_message_at || conn.lastMessageAt || null;
  const lastHb = conn.last_heartbeat_at || conn.lastHeartbeatAt || null;

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Diagnostics</h1>
          <p className="text-sm text-white/40 mt-1">轻量连接诊断（不做高频请求、不做压测）</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-medium text-white">当前配置</h2>
            </div>
            <div className="text-xs text-white/60 space-y-2 font-mono">
              <div><span className="text-white/30">ENGINE_URL</span> {ENGINE_URL}</div>
              <div><span className="text-white/30">WS_URL</span> {WS_URL}</div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-medium text-white">/api/health</h2>
              <button onClick={pollHealth} className="ml-auto text-[11px] text-white/40 hover:text-white/70">刷新</button>
            </div>
            <div className="text-xs text-white/60 space-y-1">
              <div><span className="text-white/30">最近一次</span> {fmtTime(health.at)}</div>
              <div><span className="text-white/30">状态码</span> {health.code ?? '—'} <span className="text-white/30 ml-2">latency</span> {health.latencyMs ?? '—'} ms</div>
              <div className="text-white/30 mt-2">payload（摘要）</div>
              <pre className="bg-black/30 border border-white/[0.06] rounded-lg p-3 text-[11px] text-white/60 overflow-auto max-h-40">
{health.payload ? JSON.stringify(health.payload, null, 2).slice(0, 4000) : (health.error || '—')}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-medium text-white">WebSocket</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-white/60">
            <div><span className="text-white/30">状态</span> {conn.state || '—'}</div>
            <div><span className="text-white/30">最后消息</span> {fmtTime(lastWsMsg)}</div>
            <div><span className="text-white/30">最后 heartbeat</span> {fmtTime(lastHb)}</div>
            <div><span className="text-white/30">重连次数</span> {conn.reconnect_attempt ?? conn.reconnectAttempt ?? 0}</div>
            <div><span className="text-white/30">下次重连</span> {conn.next_retry_at ? fmtTime(conn.next_retry_at) : '—'}</div>
            <div><span className="text-white/30">最近错误</span> {conn.last_error || '—'}</div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-medium text-white">错误摘要（前端）</h2>
          </div>
          {errors.length === 0 ? (
            <p className="text-xs text-white/30">暂无捕获到的 error/unhandledrejection</p>
          ) : (
            <div className="space-y-2">
              {errors.map((e, i) => (
                <div key={i} className="text-[11px] text-white/60 border-l-2 border-red-500/30 pl-2">
                  <span className="text-white/30">{fmtTime(e.ts)}</span> {e.msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

