// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Play, ArrowRight, FileStack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { submitEngineTask } from '@/lib/submitEngineTask';
import { createPlan, planToPreviewPipeline } from '@/lib/planApi';
import { listTemplates } from '@/lib/templatesApi';
import { checkTaskQuota } from '@/lib/billingQuota';
import { cn } from '@/lib/utils';
import { useStrings } from '@/i18n/useStrings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function getExampleTasks(t) {
  return [
    { id: 'tests', label: t('exampleTests'), text: t('exampleTestsText') },
    { id: 'subscribe', label: t('exampleSubscribe'), text: t('exampleSubscribeText') },
    { id: 'lint', label: t('exampleLint'), text: t('exampleLintText') },
  ];
}

export default function CommandBar({
  onTaskSubmitted,
  onPlanReady,
  className,
  showExamples = true,
  enablePlanPreview = true,
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useStrings();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const textareaRef = useRef(null);
  const exampleTasks = getExampleTasks(t);

  useEffect(() => {
    listTemplates().then(setTemplates).catch(() => setTemplates([]));
  }, []);

  const handleSubmit = async () => {
    const text = message.trim();
    if (!text || loading) return;

    setLoading(true);
    try {
      const quota = await checkTaskQuota();
      if (!quota.allowed) {
        toast({
          variant: 'destructive',
          title: t('toastQuotaExceeded'),
          description: `${quota.reason} — ${t('toastQuotaGoUsage')}`,
        });
        return;
      }
      if (enablePlanPreview && onPlanReady) {
        const plan = await createPlan(text);
        const pipeline = planToPreviewPipeline(text, plan);
        if (pipeline?.steps?.length) {
          toast({
            title: t('toastPlanReady'),
            description: t('toastPlanReadyDesc'),
          });
          await onPlanReady({ pipeline, planId: plan.plan_id, intent: text });
          setMessage('');
          return;
        }
      }

      const { taskId } = await submitEngineTask(text);
      if (!taskId) {
        throw new Error('Engine response missing task_id');
      }

      toast({
        title: t('toastTaskSubmitted'),
        description: t('toastTaskSubmittedDesc'),
      });

      if (onTaskSubmitted) {
        await onTaskSubmitted(taskId, text);
      }

      navigate(`/TaskDetail?id=${encodeURIComponent(taskId)}`);
      setMessage('');
    } catch (err) {
      console.error('[CommandBar] submit failed', err);
      toast({
        variant: 'destructive',
        title: t('toastSubmitFailed'),
        description:
          err instanceof Error ? err.message : t('toastSubmitFailedDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (!message.trim() || loading) return;
    handleSubmit();
  };

  const fillExample = (text) => {
    setMessage(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <div className={cn('space-y-4', className)} data-testid="command-bar">
      <div
        className={cn(
          'relative rounded-2xl border transition-all duration-300',
          loading
            ? 'border-blue-500/30 bg-white/[0.04]'
            : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]',
        )}
      >
        <div className="flex items-start p-4 gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPlaceholder')}
            className="flex-1 bg-transparent text-white placeholder:text-white/30 resize-none outline-none text-[15px] min-h-[72px] max-h-[160px]"
            rows={3}
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-between px-4 pb-4 gap-3 flex-wrap">
          <p className="text-[10px] text-white/25">{t('commandHint')}</p>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || loading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 h-9 text-sm font-medium disabled:opacity-30"
            data-testid="command-bar-submit"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {loading ? t('commandSubmitting') : t('commandSubmit')}
          </Button>
        </div>
      </div>

      {templates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" data-testid="template-picker">
          <FileStack className="w-4 h-4 text-white/35" />
          <Select
            value={selectedTemplateId}
            onValueChange={(id) => {
              setSelectedTemplateId(id);
              const tpl = templates.find((x) => x.id === id);
              if (tpl?.steps?.[0] && onPlanReady) {
                const hint =
                  tpl.steps[0].title || tpl.steps[0].name || (typeof tpl.steps[0] === 'string' ? tpl.steps[0] : '');
                if (hint) {
                  const pipeline = planToPreviewPipeline(hint, {
                    plan_id: `tpl-${tpl.id}`,
                    steps: tpl.steps,
                  });
                  onPlanReady({
                    pipeline,
                    planId: `tpl-${tpl.id}`,
                    intent: tpl.name,
                  });
                }
              }
            }}
          >
            <SelectTrigger className="w-[200px] h-8 text-xs bg-white/[0.03] border-white/10">
              <SelectValue placeholder={t('fromTemplate')} />
            </SelectTrigger>
            <SelectContent>
              {templates.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showExamples && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/35 uppercase tracking-wider">{t('exampleTasks')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {exampleTasks.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => fillExample(ex.text)}
                disabled={loading}
                className="text-left p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group disabled:opacity-40"
                data-testid={`example-task-${ex.id}`}
              >
                <span className="text-xs font-medium text-white/80 group-hover:text-blue-300">
                  {ex.label}
                </span>
                <p className="text-[10px] text-white/35 mt-1 line-clamp-2">{ex.text}</p>
                <ArrowRight className="w-3 h-3 text-white/20 mt-2 group-hover:text-blue-400/60" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
