import React from 'react';
import { Cpu, DollarSign } from 'lucide-react';
import { formatCost } from '@/lib/formatNumbers';
import { useStrings } from '@/i18n/useStrings';

/** Live metrics for the active (or latest) engine task. */
export default function EngineTaskMetrics({ tasks = [] }) {
  const { t } = useStrings();
  const active = tasks.find((t) =>
    ['running', 'planning', 'queued', 'awaiting_approval'].includes(t.status),
  );
  const task = active || tasks[0];
  if (!task) return null;

  const cost = task.actual_cost ?? 0;
  const tokens = task.tokens_used ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] min-w-0">
      <span className="text-[11px] text-white/40 shrink-0">{t('currentTaskMetrics')}</span>
      <span className="flex items-center gap-1.5 text-xs text-cyan-400/90">
        <DollarSign className="w-3.5 h-3.5 shrink-0" />
        {formatCost(cost)}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-purple-400/90">
        <Cpu className="w-3.5 h-3.5 shrink-0" />
        {tokens.toLocaleString()} {t('tokensUnit')}
      </span>
      <span className="text-[10px] text-white/25 truncate min-w-0 flex-1">{task.title}</span>
    </div>
  );
}
