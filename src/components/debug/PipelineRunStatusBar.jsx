// @ts-nocheck
import React from 'react';
import { usePipelineRun } from '@/hooks/usePipelineRun';
import { RUN_PHASES } from '@/lib/pipelineRunStore';
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ORDERED = [
  'sending',
  'backend_received',
  'pipeline_started',
  'planner_running',
  'tool_selected',
  'tool_running',
  'tool_finished',
  'llm_streaming',
  'completed',
  'failed',
];

function phaseIndex(phase) {
  const o = RUN_PHASES[phase]?.order ?? -1;
  return o;
}

export default function PipelineRunStatusBar() {
  const run = usePipelineRun();
  if (run.phase === 'idle') return null;

  const currentOrder = phaseIndex(run.phase);
  const isFailed = run.phase === 'failed';
  const isDone = run.phase === 'completed';

  return (
    <div
      className={cn(
        'mx-4 mt-3 mb-0 rounded-xl border px-4 py-3 text-xs',
        isFailed
          ? 'border-red-500/30 bg-red-500/10'
          : isDone
            ? 'border-emerald-500/25 bg-emerald-500/10'
            : 'border-cyan-500/20 bg-cyan-500/5',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {isFailed ? (
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
        )}
        <span className={cn('font-medium', isFailed ? 'text-red-300' : isDone ? 'text-emerald-300' : 'text-cyan-200')}>
          {run.label}
        </span>
        {run.taskId && <span className="text-white/35 font-mono">task: {run.taskId}</span>}
        {run.requestId && (
          <span className="text-white/25 font-mono">
            req: {run.requestId.length > 28 ? `${run.requestId.slice(0, 28)}…` : run.requestId}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ORDERED.filter((p) => p !== 'failed').map((p) => {
          const o = phaseIndex(p);
          const active = run.phase === p;
          const done = !isFailed && currentOrder > o;
          const pending = currentOrder < o && !isFailed;
          return (
            <span
              key={p}
              className={cn(
                'px-2 py-0.5 rounded-md border font-mono text-[10px]',
                active && 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200',
                done && 'border-white/10 bg-white/[0.04] text-white/45',
                pending && 'border-white/[0.06] text-white/20',
                isFailed && active && 'border-red-400/50 bg-red-500/15 text-red-200',
              )}
            >
              {RUN_PHASES[p]?.label || p}
            </span>
          );
        })}
      </div>

      {run.error && (
        <div className="mt-2 flex items-start gap-2 text-red-300/90">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <p>{run.error.message}</p>
            {run.error.stack && (
              <pre className="mt-1 text-[10px] text-red-200/60 overflow-auto max-h-24 whitespace-pre-wrap">
                {run.error.stack}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
