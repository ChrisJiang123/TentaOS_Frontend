// @ts-nocheck
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStrings } from '@/i18n/useStrings';

/** Shows Engine final answer (task.answer → result.answer → output). */
export default function FinalAnswerCard({ pipeline, className }) {
  const { t } = useStrings();
  const answer = pipeline?.answer?.trim();
  if (!answer) return null;

  const terminal =
    pipeline.status === 'completed' ||
    pipeline.status === 'failed' ||
    pipeline.status === 'cancelled';

  if (!terminal && pipeline.mode === 'live') return null;

  return (
    <div
      className={cn(
        'rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-5 mb-6',
        className,
      )}
      data-testid="final-answer-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-medium text-white">{t('finalAnswer')}</h3>
      </div>
      <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-h-[320px] overflow-y-auto">
        {answer}
      </div>
    </div>
  );
}
