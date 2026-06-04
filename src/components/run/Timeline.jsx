// @ts-nocheck
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

const TYPE_LABELS = {
  step: '步骤',
  approval: '审批',
  checkpoint: '检查点',
  fork: 'Fork',
  merge: '合并',
  task: '任务',
};

/**
 * Phase 15 — horizontal event timeline for replay / completed runs.
 */
export default function Timeline({ events = [], selectedIndex = 0, onSelect, mode = 'replay' }) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => (a.ts || 0) - (b.ts || 0)),
    [events],
  );

  if (!sorted.length) return null;

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 overflow-x-auto"
      data-testid="run-timeline"
    >
      <p className="text-[11px] text-white/40 mb-3 uppercase tracking-wider">执行时间线</p>
      <div className="flex items-center gap-1 min-w-max pb-2">
        {sorted.map((ev, i) => {
          const active = i === selectedIndex;
          return (
            <button
              key={ev.id || i}
              type="button"
              onClick={() => onSelect?.(i, ev)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors min-w-[72px]',
                active ? 'bg-blue-500/15 border border-blue-500/30' : 'hover:bg-white/[0.04]',
              )}
              title={ev.label}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  ev.type === 'approval' && 'bg-amber-400',
                  ev.type === 'checkpoint' && 'bg-violet-400',
                  ev.type === 'fork' && 'bg-fuchsia-400',
                  ev.type === 'merge' && 'bg-emerald-400',
                  (!ev.type || ev.type === 'step') && 'bg-blue-400',
                )}
              />
              <span className="text-[9px] text-white/50">{TYPE_LABELS[ev.type] || ev.type}</span>
              <span className="text-[9px] text-white/70 line-clamp-2 text-center max-w-[80px]">
                {ev.label}
              </span>
            </button>
          );
        })}
      </div>
      {mode === 'replay' && sorted.length > 1 && (
        <input
          type="range"
          min={0}
          max={sorted.length - 1}
          value={selectedIndex}
          onChange={(e) => onSelect?.(Number(e.target.value), sorted[Number(e.target.value)])}
          className="w-full mt-2 accent-blue-500"
          data-testid="timeline-scrubber"
        />
      )}
    </div>
  );
}

/** Build timeline nodes from pipeline + runtime buffers. */
export function buildTimelineEvents(pipeline, runtimeExtras = {}) {
  const events = [];
  const baseTs = Date.now() - (pipeline?.steps?.length || 1) * 60000;

  (pipeline?.steps || []).forEach((step, i) => {
    events.push({
      id: `step-${step.id}`,
      type: 'step',
      ts: baseTs + i * 60000,
      stepId: step.id,
      label: step.title,
    });
    if (step.checkpointId) {
      events.push({
        id: `cp-${step.checkpointId}`,
        type: 'checkpoint',
        ts: baseTs + i * 60000 + 1000,
        stepId: step.id,
        label: `检查点 ${step.checkpointId}`,
      });
    }
    if (step._approval) {
      events.push({
        id: `ap-${step.id}`,
        type: 'approval',
        ts: baseTs + i * 60000 + 500,
        stepId: step.id,
        label: `审批 · ${step.title}`,
      });
    }
  });

  (pipeline?.forks || []).forEach((fork, fi) => {
    events.push({
      id: `fork-${fork.id}`,
      type: 'fork',
      ts: baseTs + fi * 30000,
      label: `Fork · ${fork.strategy}`,
    });
  });

  (runtimeExtras.mergeEvents || []).forEach((m, mi) => {
    events.push({
      id: `merge-${mi}`,
      type: 'merge',
      ts: baseTs + 120000 + mi * 1000,
      label: `合并 · ${m.fork_id || 'winner'}`,
    });
  });

  return events;
}
