// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import engineClient from '@/lib/engineClient';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useStrings } from '@/i18n/useStrings';

const riskColors = {
  low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Low risk' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Medium risk' },
  high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'High risk' },
};

export default function ApprovalDialog() {
  const { toast } = useToast();
  const { t } = useStrings();
  const [approval, setApproval] = useState(null);
  const open = Boolean(approval);

  useEffect(() => {
    return engineClient.on('approval_required', (data) => {
      setApproval(data);
    });
  }, []);

  const close = useCallback(() => setApproval(null), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const risk = riskColors[approval?.risk_level] || riskColors.medium;

  const handleDecision = async (approved) => {
    const id = approval?.approval_id || approval?.id;
    if (id) {
      try {
        await engineClient.approveViaAPI(id, approved, '');
        toast({
          title: approved ? t('approve') : t('reject'),
          description: `Approval ${id}`,
        });
      } catch (e) {
        console.error('Approval API failed:', e);
        toast({
          variant: 'destructive',
          title: t('approvalFailed'),
          description: e instanceof Error ? e.message : String(e),
        });
        return;
      }
    }
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent
        className="bg-[#0E0E15] border-white/10 text-white sm:max-w-md"
        onPointerDownOutside={close}
        onEscapeKeyDown={close}
      >
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', risk.bg)}>
              <Shield className={cn('w-5 h-5', risk.text)} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-white text-left">{t('needsApproval')}</DialogTitle>
              <span
                className={cn(
                  'inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full border',
                  risk.bg,
                  risk.text,
                  risk.border,
                )}
              >
                {risk.label}
              </span>
            </div>
          </div>
          <DialogDescription className="text-left text-white/55 pt-2">
            {approval?.description ||
              approval?.summary ||
              'An agent action requires your approval before it can continue.'}
          </DialogDescription>
        </DialogHeader>

        {approval?.agent && (
          <p className="text-[11px] text-white/35 -mt-2">Agent: {approval.agent}</p>
        )}
        {approval?.action_type && (
          <p className="text-[11px] text-white/35">Action: {approval.action_type}</p>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={close}
            className="text-white/50 hover:text-white hover:bg-white/[0.06]"
          >
            {t('dismissLater')}
          </Button>
          <div className="flex gap-2 flex-1 sm:flex-initial">
            <Button
              type="button"
              onClick={() => handleDecision(false)}
              variant="outline"
              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <XCircle className="w-4 h-4 mr-2" />
              {t('reject')}
            </Button>
            <Button
              type="button"
              onClick={() => handleDecision(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t('approve')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
