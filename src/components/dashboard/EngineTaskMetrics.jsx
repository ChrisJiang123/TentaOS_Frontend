import React from 'react';
import { Cpu, DollarSign } from 'lucide-react';

/** 当前（优先运行中）引擎任务的成本与 token */
export default function EngineTaskMetrics({ tasks = [] }) {
  const active = tasks.find((t) =>
    ['running', 'planning', 'queued', 'awaiting_approval'].includes(t.status),
  );
  const task = active || tasks[0];
  if (!task) return null;

  const cost = task.actual_cost ?? 0;
  const tokens = task.tokens_used ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <span className="text-[11px] text-white/40">当前任务指标</span>
      <span className="flex items-center gap-1.5 text-xs text-cyan-400/90">
        <DollarSign className="w-3.5 h-3.5" />
        ${Number(cost).toFixed(4)}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-purple-400/90">
        <Cpu className="w-3.5 h-3.5" />
        {tokens.toLocaleString()} tokens
      </span>
      <span className="text-[10px] text-white/25 truncate max-w-[200px]">{task.title}</span>
    </div>
  );
}
