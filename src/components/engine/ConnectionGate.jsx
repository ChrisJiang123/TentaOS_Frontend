import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ENGINE_URL,
  WS_URL,
  DEFAULT_DEMO_ENGINE_URL,
  setEngineUrl,
  clearEngineUrl,
  hasEngineOverride,
  saveEngineUrlQuiet,
  bootstrapDemoEngineIfNeeded,
} from '@/config';
import engineClient from '@/lib/engineClient';
import { Loader2, Plug, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * Wraps Dashboard. Auto-connects to the public demo Engine when healthy;
 * otherwise shows a manual connection guide.
 */
export default function ConnectionGate({ children, onConnected }) {
  const [status, setStatus] = useState('checking'); // checking | connected | offline
  const [input, setInput] = useState('');
  const [probing, setProbing] = useState(false);
  const [resolvedEngineUrl, setResolvedEngineUrl] = useState(ENGINE_URL);
  const [resolvedWsUrl, setResolvedWsUrl] = useState(WS_URL);

  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpEngine = resolvedEngineUrl.startsWith('http://');
  const mixedContentRisk = isHttpsPage && isHttpEngine;

  const connectedNotified = useRef(false);
  const bootstrapDone = useRef(false);

  const probe = useCallback(async () => {
    setProbing(true);
    try {
      const health = await engineClient.getHealth();
      const wsHint = health?.inferred_ws_url || health?.ws_url;
      if (wsHint) {
        const ws = String(wsHint).trim().replace(/\/$/, '');
        setResolvedWsUrl(ws);
        if (!hasEngineOverride() && import.meta.env.PROD) {
          saveEngineUrlQuiet(resolvedEngineUrl, ws);
        }
      } else if (!hasEngineOverride() && import.meta.env.PROD) {
        saveEngineUrlQuiet(resolvedEngineUrl, resolvedWsUrl);
      }
      setStatus('connected');
      if (!connectedNotified.current) {
        connectedNotified.current = true;
        onConnected?.();
      }
    } catch {
      setStatus('offline');
      connectedNotified.current = false;
    } finally {
      setProbing(false);
    }
  }, [onConnected, resolvedEngineUrl, resolvedWsUrl]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!bootstrapDone.current && import.meta.env.PROD && !hasEngineOverride()) {
        bootstrapDone.current = true;
        const result = await bootstrapDemoEngineIfNeeded();
        if (cancelled) return;
        if (result.ok && result.engineUrl) {
          setResolvedEngineUrl(result.engineUrl);
          setResolvedWsUrl(result.wsUrl || WS_URL);
        }
      }
      if (!cancelled) await probe();
    }

    init();
    const t = setInterval(probe, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [probe]);

  if (status === 'checking') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#06060B]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
          <span className="text-xs text-white/40">正在连接 Engine…</span>
        </div>
      </div>
    );
  }

  if (status === 'connected') {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#06060B]">
      <div className="w-full max-w-lg">
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Plug className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">连接你的 TentaOS Engine</h1>
              <p className="text-xs text-white/40">无法自动连接 {DEFAULT_DEMO_ENGINE_URL}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-white/60 mb-5">
            <p>请确认：</p>
            <ol className="space-y-2 text-[13px] text-white/50 list-decimal list-inside">
              <li>Engine 已在你的电脑上启动（<code className="text-cyan-300/80 bg-white/[0.04] px-1 rounded">node server.js</code>）</li>
              <li>默认 demo 地址为 <span className="font-mono text-cyan-300/80">{DEFAULT_DEMO_ENGINE_URL}</span></li>
              <li>若使用本地或 ngrok 隧道，请在下方手动填写 HTTPS Engine 地址</li>
            </ol>
          </div>

          {mixedContentRisk && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-red-300/90">
                当前地址是 <span className="font-mono">{resolvedEngineUrl}</span>，是 http。
                这个页面是 https，浏览器会拦截 http 请求（任务发不出去且不报错）。
                请改用 <span className="font-semibold">https</span> 地址。
              </p>
            </div>
          )}

          <label className="text-[11px] text-white/40 block mb-1.5">Engine 地址</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={DEFAULT_DEMO_ENGINE_URL}
              className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-white font-mono placeholder:text-white/25 outline-none focus:border-blue-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && input.trim()) setEngineUrl(input.trim());
              }}
            />
            <button
              onClick={() => input.trim() && setEngineUrl(input.trim())}
              disabled={!input.trim()}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-30 flex items-center gap-1.5 whitespace-nowrap"
            >
              连接 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.06]">
            <div className="text-[11px] text-white/30 font-mono">
              <div>当前: {resolvedEngineUrl}</div>
              <div>WS: {resolvedWsUrl}</div>
              {hasEngineOverride() && <div className="text-amber-400/70">已用自定义地址</div>}
            </div>
            <div className="flex items-center gap-2">
              {hasEngineOverride() && (
                <button onClick={clearEngineUrl} className="text-[11px] text-white/40 hover:text-white/60">
                  重置
                </button>
              )}
              <button
                onClick={probe}
                disabled={probing}
                className="text-[11px] text-blue-400/80 hover:text-blue-400 flex items-center gap-1"
              >
                {probing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                重试连接
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/25 mt-4">
          本地开发（前后端同机）可直接用 http://localhost:3001 —— 不会有 https 拦截问题。
        </p>
      </div>
    </div>
  );
}
