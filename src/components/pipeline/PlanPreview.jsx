// @ts-nocheck
import React, { useMemo, useState } from 'react';
import {
  Play,
  Trash2,
  SkipForward,
  Terminal,
  Globe,
  FileText,
  Cpu,
  Shield,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getStepStatusConfig } from '@/lib/pipelineStatus';
import { submitEngineTask } from '@/lib/submitEngineTask';
import { createTemplate } from '@/lib/templatesApi';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useStrings } from '@/i18n/useStrings';

const TOOL_ICONS = {
  terminal: Terminal,
  browser: Globe,
  file: FileText,
  model: Cpu,
};

const RISK_STYLES = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function PlanPreview({ pipeline, planId, intent, onClose, onLaunched }) {
  const { toast } = useToast();
  const { t } = useStrings();
  const navigate = useNavigate();
  const [steps, setSteps] = useState(() => pipeline?.steps || []);
  const [launching, setLaunching] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);

  const verificationLabel = (step) => {
    const v = step?.verification;
    if (!v?.expression) return t('planVerifyManual');
    const prefix =
      v.type === 'test'
        ? t('planVerifyRun')
        : v.type === 'build'
          ? t('planVerifyExec')
          : `${t('verifyPrefix')} `;
    return `${prefix}\`${v.expression}\``;
  };

  const activeSteps = useMemo(() => steps.filter((s) => s.status !== 'skipped'), [steps]);

  const removeStep = (id) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const skipStep = (id) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'skipped' } : s)),
    );
  };

  const handleLaunch = async () => {
    if (!activeSteps.length) {
      toast({ variant: 'destructive', title: t('planCannotLaunch'), description: t('planMinOneStep') });
      return;
    }
    setLaunching(true);
    try {
      const { taskId } = await submitEngineTask(intent, { planId });
      if (!taskId) throw new Error(t('planMissingTaskId'));
      toast({ title: t('planLaunched'), description: t('toastTaskSubmittedDesc') });
      if (onLaunched) await onLaunched(taskId);
      navigate(`/TaskDetail?id=${encodeURIComponent(taskId)}`);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('planLaunchFailed'),
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLaunching(false);
    }
  };

  if (!pipeline || !steps.length) return null;

  return (
    <div
      className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-4"
      data-testid="plan-preview"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-white">{t('planPreviewTitle')}</h3>
          <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{intent}</p>
          {planId && (
            <p className="text-[10px] text-white/25 mt-1 font-mono">plan: {planId}</p>
          )}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-xs text-white/30 hover:text-white/50">
            {t('planClose')}
          </button>
        )}
      </div>

      <ol className="space-y-2">
        {steps.map((step, i) => {
          const ToolIcon = TOOL_ICONS[step.tool] || Terminal;
          const riskStyle = RISK_STYLES[step.risk] || RISK_STYLES.low;
          const isHigh = step.risk === 'high';
          const isSkipped = step.status === 'skipped';
          const statusCfg = getStepStatusConfig(step.status);

          return (
            <li
              key={step.id}
              className={cn(
                'rounded-xl border p-4 transition-all',
                isSkipped && 'opacity-40',
                isHigh ? 'border-red-500/40 bg-red-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02]',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-white/30 w-6 pt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <ToolIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">{step.title}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border capitalize', riskStyle)}>
                      {step.risk} risk
                    </span>
                    {isHigh && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {t('planNeedsApproval')}
                      </span>
                    )}
                    {isSkipped && (
                      <span className={cn('text-[10px]', statusCfg.color)}>{t('planSkipped')}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/45">{verificationLabel(step)}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    type="button"
                    title={t('planSkip')}
                    onClick={() => skipStep(step.id)}
                    disabled={isSkipped}
                    className="p-1.5 rounded-md text-white/30 hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-30"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title={t('planDelete')}
                    onClick={() => removeStep(step.id)}
                    className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={savingTpl || !activeSteps.length}
          className="flex-1 border-white/10 text-white/70"
          data-testid="save-as-template"
          onClick={async () => {
            const name = window.prompt('Template name', intent?.slice(0, 40) || 'My plan');
            if (!name?.trim()) return;
            setSavingTpl(true);
            try {
              await createTemplate({ name: name.trim(), steps: activeSteps });
              toast({ title: t('planTemplateSaved'), description: name.trim() });
            } catch (err) {
              toast({
                variant: 'destructive',
                title: t('planSaveTemplateFailed'),
                description: err instanceof Error ? err.message : String(err),
              });
            } finally {
              setSavingTpl(false);
            }
          }}
        >
          {savingTpl ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {t('planSaveTemplate')}
        </Button>
        <Button
          onClick={handleLaunch}
          disabled={launching || !activeSteps.length}
          className="flex-[2] bg-blue-600 hover:bg-blue-500 h-10 rounded-xl"
          data-testid="plan-preview-launch"
        >
          {launching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {t('planLaunch')} ({activeSteps.length} {t('planSteps')})
        </Button>
      </div>
    </div>
  );
}
