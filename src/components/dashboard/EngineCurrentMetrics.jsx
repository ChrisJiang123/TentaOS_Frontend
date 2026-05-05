import React from 'react';
import { Cpu, DollarSign } from 'lucide-react';

export default function EngineCurrentMetrics({ tasks = [] }) {
  const active = tasks.find((t) =>
    ['running', 'planning', 'queued', 'awaiting_approval'].includes(t.status),
  );
  if (!active) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-white/60 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
      <span className="text-white/40">当前任务</span>
      <span className="flex items-center gap-1.5 tabular-nums">
        <Cpu className="w-3.5 h-3.5 text-purple-400" />
        Tokens: {(active.tokens_used || 0).toLocaleString()}
      </span>
      <span className="flex items-center gap-1.5 tabular-nums">
        <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
        成本: ${(active.actual_cost || 0).toFixed(4)}
      </span>
      <span className="text-white/30 truncate max-w-[200px]">{active.title}</span>
    </div>
  );
}
