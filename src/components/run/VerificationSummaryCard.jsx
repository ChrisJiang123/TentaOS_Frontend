// @ts-nocheck
import React from 'react';
import { CheckCircle2, XCircle, Clock, DollarSign, FileDiff } from 'lucide-react';
import { canShowSuccessCompletion } from '@/lib/taskVerification';
import { formatCostShort } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';

export default function VerificationSummaryCard({ pipeline, onViewDiff }) {
  if (!pipeline) return null;
  const summary = pipeline.verification_summary;
  const checks = summary?.checks || [];
  const success = canShowSuccessCompletion(pipeline);

  if (pipeline.status !== 'completed' && pipeline.status !== 'failed' && !summary) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-5 mb-6',
        success
          ? 'border-emerald-500/25 bg-emerald-500/[0.05]'
          : 'border-red-500/25 bg-red-500/[0.05]',
      )}
      data-testid="verification-summary"
    >
      <div className="flex items-center gap-2 mb-3">
        {success ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400" />
        )}
        <h3 className="text-sm font-medium text-white">
          {success ? '验证摘要' : '验证未通过'}
        </h3>
      </div>
      {checks.length > 0 ? (
        <ul className="space-y-1.5 mb-4">
          {checks.map((c, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              {c.result === 'pass' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className="text-white/60 capitalize">{c.type}</span>
              {c.detail && <span className="text-white/40">— {c.detail}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-white/40 mb-4">后端未返回 verification_summary.checks</p>
      )}
      <div className="flex flex-wrap gap-4 text-[11px] text-white/40">
        {summary?.duration_ms != null && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {(summary.duration_ms / 1000).toFixed(1)}s
          </span>
        )}
        {summary?.cost != null && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatCostShort(summary.cost, 4)}
          </span>
        )}
        {summary?.final_diff_ref && onViewDiff && (
          <button
            type="button"
            onClick={onViewDiff}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
          >
            <FileDiff className="w-3 h-3" />
            查看最终 diff
          </button>
        )}
      </div>
    </div>
  );
}
