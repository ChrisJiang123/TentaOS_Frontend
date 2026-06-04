// @ts-nocheck
import React, { useState, useRef } from 'react';
import { submitEngineTask } from '@/lib/submitEngineTask';
import { parseTaskIdFromSubmitResponse } from '@/lib/engineTaskUtils';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Play, DollarSign, Clock, Cpu, Coins, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import QuickCommands from './QuickCommands';
import StepEditor from './StepEditor';
import CommandBar from './CommandBar';
import PlanPreview from './PlanPreview';
import { createPlan, planToPreviewPipeline } from '@/lib/planApi';
import { useStrings } from '@/i18n/useStrings';

const CHEAP_MODELS = ['deepseek/deepseek-chat', 'openai/gpt-4o-mini', 'google/gemini-2.5-flash'];

export default function PipelineChat({
  onEngineTaskSubmitted,
  approvalMode,
  onApprovalToggle,
}) {
  const { toast } = useToast();
  const { t } = useStrings();
  const [message, setMessage] = useState('');
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [budgetMode, setBudgetMode] = useState('balanced');
  const [showCommands, setShowCommands] = useState(false);
  const [history, setHistory] = useState([]); // conversation context
  const [planPreview, setPlanPreview] = useState(null);
  const textareaRef = useRef(null);

  const handleGenerate = async () => {
    const text = message.trim();
    if (!text || loading) return;
    setLoading(true);
    try {
      const plan = await createPlan(text);
      const previewPipeline = planToPreviewPipeline(text, plan);
      if (previewPipeline?.steps?.length) {
        setPlanPreview({ pipeline: previewPipeline, planId: plan.plan_id, intent: text });
        toast({ title: t('toastPlanReady'), description: t('toastPlanReadyDesc') });
      } else {
        setPipeline(previewPipeline);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('toastSubmitFailed'),
        description: err instanceof Error ? err.message : t('toastSubmitFailedDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCommandSelect = (cmd) => {
    setMessage(cmd.cmd + ' ');
    setShowCommands(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleMessageChange = (e) => {
    const val = e.target.value;
    setMessage(val);
    setShowCommands(val === '/');
  };

  const handleStepChange = (index, updatedStep) => {
    if (!pipeline) return;
    const newSteps = [...pipeline.steps];
    newSteps[index] = { ...newSteps[index], ...updatedStep };
    // Recalculate total cost
    const totalCost = newSteps.reduce((s, st) => s + (st.estimated_cost_usd || 0), 0);
    setPipeline({ ...pipeline, steps: newSteps, total_estimated_cost_usd: totalCost });
  };

  const handleStepRemove = (index) => {
    if (!pipeline) return;
    const newSteps = pipeline.steps.filter((_, i) => i !== index);
    const totalCost = newSteps.reduce((s, st) => s + (st.estimated_cost_usd || 0), 0);
    setPipeline({ ...pipeline, steps: newSteps, total_estimated_cost_usd: totalCost });
  };

  const handleUseCheaper = () => {
    if (!pipeline) return;
    const newSteps = pipeline.steps.map((step, i) => ({
      ...step,
      recommended_model: CHEAP_MODELS[i % CHEAP_MODELS.length],
      estimated_cost_usd: 0.002,
    }));
    const totalCost = newSteps.length * 0.002;
    setPipeline({ ...pipeline, steps: newSteps, total_estimated_cost_usd: totalCost });
  };

  const [submitted, setSubmitted] = useState(false);

  const notifyEngineTask = async (taskId, text, pipelineMeta) => {
    if (onEngineTaskSubmitted) {
      await onEngineTaskSubmitted(String(taskId), text, pipelineMeta);
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const handleCommandBarSubmitted = async (taskId, text) => {
    await notifyEngineTask(taskId, text, null);
    setMessage('');
    setPipeline(null);
    setHistory([]);
  };

  const handleLaunch = async () => {
    if (!pipeline) return;
    const text = message.trim() || pipeline.pipeline_name || 'Run pipeline';
    setLoading(true);
    try {
      const { res, taskId } = await submitEngineTask(text);
      const tid = taskId ?? parseTaskIdFromSubmitResponse(res);
      if (!tid) {
        throw new Error('Engine response missing task_id');
      }
      await notifyEngineTask(tid, text, pipeline);
      setMessage('');
      setPipeline(null);
      setHistory([]);
    } catch (err) {
      console.error('Engine submit failed:', err);
      toast({
        variant: 'destructive',
        title: t('toastSubmitFailed'),
        description: err instanceof Error ? err.message : t('toastSubmitFailedDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Submission confirmation */}
      {submitted && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">{t('taskSubmittedBanner')}</span>
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-2 text-sm text-cyan-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('sendingRequest')}
        </div>
      )}

      <CommandBar
        onPlanReady={({ pipeline, planId, intent }) => {
          setPlanPreview({ pipeline, planId, intent });
        }}
        onTaskSubmitted={handleCommandBarSubmitted}
      />

      {planPreview && (
        <PlanPreview
          pipeline={planPreview.pipeline}
          planId={planPreview.planId}
          intent={planPreview.intent}
          onClose={() => setPlanPreview(null)}
          onLaunched={async (taskId) => {
            await handleCommandBarSubmitted(taskId, planPreview.intent);
            setPlanPreview(null);
          }}
        />
      )}

      {/* Advanced: slash commands + pipeline designer (optional) */}
      <details className="group rounded-xl border border-white/[0.06] bg-white/[0.01]">
        <summary className="cursor-pointer px-4 py-2 text-[11px] text-white/40 hover:text-white/60 list-none flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5" />
          {t('advancedPipelineSummary')}
        </summary>
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06]">
          <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <QuickCommands visible={showCommands} onSelect={handleCommandSelect} />
            <div className="flex items-start p-3 gap-2">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleMessageChange}
                placeholder={t('advancedPipelinePlaceholder')}
                className="flex-1 bg-transparent text-white placeholder:text-white/30 resize-none outline-none text-sm min-h-[48px]"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowCommands(false);
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-3 pb-3">
              <button
                type="button"
                onClick={() => onApprovalToggle && onApprovalToggle(!approvalMode)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[10px]',
                  approvalMode
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-white/25 hover:text-white/40',
                )}
              >
                <Shield className="w-3 h-3" />
                {approvalMode ? t('approvalOn') : t('approvalOff')}
              </button>
              <Button
                onClick={handleGenerate}
                disabled={!message.trim() || loading}
                size="sm"
                variant="outline"
                className="border-purple-500/30 text-purple-300 h-8 text-xs"
              >
                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                {t('designPipeline')}
              </Button>
            </div>
          </div>
        </div>
      </details>

      {/* Pipeline preview with editable steps */}
      <AnimatePresence>
        {pipeline && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">{pipeline.pipeline_name}</h3>
                <p className="text-[11px] text-white/40 mt-0.5">{pipeline.description}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <DollarSign className="w-3 h-3" />
                  预估: ${(pipeline.total_estimated_cost_usd || 0).toFixed(3)}
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <Clock className="w-3 h-3" />
                  ~{Math.round((pipeline.estimated_duration_seconds || 60) / 60)}分钟
                </span>
              </div>
            </div>

            {/* Editable Steps */}
            <div className="space-y-2">
              {pipeline.steps.map((step, i) => (
                <StepEditor
                  key={step.step_id || i}
                  step={step}
                  index={i}
                  onChange={handleStepChange}
                  onRemove={handleStepRemove}
                />
              ))}
            </div>

            {/* Model Routing Panel */}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleLaunch}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white h-10 text-sm font-medium rounded-xl"
              >
                <Play className="w-4 h-4 mr-2" />
                开始运行 ({pipeline.steps.length} 步 · ~${(pipeline.total_estimated_cost_usd || 0).toFixed(3)})
              </Button>
              <Button
                onClick={handleUseCheaper}
                variant="outline"
                className="border-white/10 text-white/50 hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5 h-10 text-xs rounded-xl px-4"
              >
                <Coins className="w-4 h-4 mr-1.5" />
                用更便宜的
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}