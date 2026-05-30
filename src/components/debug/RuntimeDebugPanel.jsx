// @ts-nocheck
import React, { useState } from 'react';
import { useRuntimeDebug } from '@/hooks/useRuntimeDebug';
import { runtimeDebug } from '@/lib/runtimeDebug';
import { RUNTIME_CONFIG, isLocalhostUrl } from '@/lib/runtimeConfig';
import { Bug, ChevronDown, ChevronUp, Trash2, Wifi, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'tentaos-runtime-debug-open';

function statusDot(ok) {
  if (ok === true) return 'bg-emerald-400';
  if (ok === false) return 'bg-red-400';
  return 'bg-amber-400';
}

function fmtTs(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return '';
  }
}

export default function RuntimeDebugPanel() {
  const snap = useRuntimeDebug();
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [expanded, setExpanded] = useState(true);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const httpOk = snap.backendHttpOk;
  const wsOk = snap.wsState === 'connected';
  const localhostWarn =
    RUNTIME_CONFIG.usingLocalhostFallback ||
    isLocalhostUrl(snap.engineUrl) ||
    isLocalhostUrl(snap.wsUrl);

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'fixed bottom-4 right-4 z-[90] flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium shadow-lg',
          open
            ? 'bg-violet-600/90 border-violet-400/40 text-white'
            : 'bg-[#12121a]/95 border-white/10 text-white/70 hover:text-white',
        )}
        title="Runtime Debug Console"
      >
        <Bug className="w-4 h-4" />
        Debug
        <span className={cn('w-2 h-2 rounded-full', statusDot(httpOk && wsOk))} />
      </button>

      {open && (
        <div className="fixed bottom-14 right-4 z-[90] w-[min(420px,calc(100vw-2rem))] max-h-[min(70vh,520px)] flex flex-col rounded-2xl border border-white/10 bg-[#0c0c14]/98 shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.08]">
            <Bug className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-medium text-white">Runtime Console</span>
            <span className="text-[10px] text-white/30 ml-1">({RUNTIME_CONFIG.mode})</span>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="ml-auto p-1 text-white/40 hover:text-white/70"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => runtimeDebug.clearLogs()}
              className="p-1 text-white/40 hover:text-white/70"
              title="Clear logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {expanded && (
            <>
              {localhostWarn && (
                <div className="px-3 py-2 text-[10px] text-amber-300/90 bg-amber-500/10 border-b border-amber-500/20">
                  正在使用 localhost 或未配置 VITE_ENGINE_URL。Demo 默认使用 https://engine.tentaos.com，或在 Settings 中手动覆盖。
                </div>
              )}

              <div className="px-3 py-2 grid grid-cols-2 gap-2 text-[10px] border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <Server className="w-3 h-3 text-cyan-400" />
                  <span className="text-white/40">HTTP</span>
                  <span className={cn(httpOk ? 'text-emerald-400' : httpOk === false ? 'text-red-400' : 'text-amber-400')}>
                    {httpOk === true ? 'connected' : httpOk === false ? 'disconnected' : 'checking…'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3 text-violet-400" />
                  <span className="text-white/40">WS</span>
                  <span className={cn(wsOk ? 'text-emerald-400' : 'text-amber-400')}>{snap.wsState}</span>
                </div>
              </div>

              <div className="px-3 py-2 text-[10px] font-mono text-white/50 space-y-1 border-b border-white/[0.06] max-h-24 overflow-auto">
                <div>
                  <span className="text-white/25">ENGINE </span>
                  {snap.engineUrl || '(not set)'}
                </div>
                <div>
                  <span className="text-white/25">WS </span>
                  {snap.wsUrl || '(not set)'}
                </div>
                <div>
                  <span className="text-white/25">ids </span>
                  req={snap.ids.request_id || '—'} task={snap.ids.task_id || '—'} pipe=
                  {snap.ids.pipeline_id || '—'}
                </div>
                <div>
                  <span className="text-white/25">stage </span>
                  {snap.pipelineStage}
                  {snap.streaming ? ' · streaming' : ''}
                </div>
              </div>

              {snap.lastError && (
                <div className="px-3 py-2 text-[10px] text-red-300/90 bg-red-500/10 border-b border-red-500/20 max-h-20 overflow-auto">
                  <div className="font-medium">{snap.lastError.context || 'error'}</div>
                  <div>{snap.lastError.message}</div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px]">
                {snap.logs.length === 0 ? (
                  <span className="text-white/25 px-1">No events yet</span>
                ) : (
                  snap.logs.map((log, i) => (
                    <div
                      key={`${log.ts}-${i}`}
                      className={cn(
                        'rounded px-2 py-1 border-l-2',
                        log.level === 'error'
                          ? 'border-red-500/50 bg-red-500/5 text-red-200/80'
                          : 'border-white/10 bg-white/[0.02] text-white/55',
                      )}
                    >
                      <span className="text-white/25">{fmtTs(log.ts)} </span>
                      <span className="text-violet-300/80">[{log.kind}]</span> {log.message}
                      {log.detail && (
                        <pre className="mt-0.5 text-white/35 whitespace-pre-wrap break-all max-h-16 overflow-auto">
                          {log.detail}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
