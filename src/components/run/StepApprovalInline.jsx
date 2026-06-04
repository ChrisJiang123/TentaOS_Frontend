// @ts-nocheck
import React, { useState } from 'react';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStrings } from '@/i18n/useStrings';

export default function StepApprovalInline({ approval, onResolve }) {
  const { t } = useStrings();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const impact = approval?.expected_impact || {};
  const files = impact.files || [];
  const commands = impact.commands || [];

  const decide = async (approved) => {
    setBusy(true);
    try {
      await onResolve(approval.id, approved, feedback);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4 space-y-3"
      data-testid="step-approval-inline"
    >
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-white">{t('needsApproval')}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 capitalize">
          {approval.risk} risk
        </span>
      </div>
      <p className="text-xs text-white/60">{approval.reason || approval.action}</p>
      {approval.action && (
        <p className="text-[11px] text-white/45">
          <span className="text-white/30">{t('approvalAction')}:</span> {approval.action}
        </p>
      )}
      {(files.length > 0 || commands.length > 0) && (
        <div className="rounded-lg bg-black/30 p-3 text-[11px] font-mono space-y-2">
          <p className="text-white/40 text-[10px] uppercase tracking-wide">{t('expectedImpact')}</p>
          {files.map((f) => (
            <p key={f} className="text-cyan-300/80">
              file: {f}
            </p>
          ))}
          {commands.map((c) => (
            <p key={c} className="text-amber-200/80">
              $ {c}
            </p>
          ))}
        </div>
      )}
      <input
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder={t('rejectReasonPlaceholder')}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => decide(true)}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-8 text-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          {t('approve')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => decide(false)}
          className={cn('flex-1 border-red-500/30 text-red-400 h-8 text-xs')}
        >
          <XCircle className="w-3.5 h-3.5 mr-1" />
          {t('reject')}
        </Button>
      </div>
    </div>
  );
}
