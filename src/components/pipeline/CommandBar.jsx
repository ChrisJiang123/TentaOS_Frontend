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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const EXAMPLE_TASKS = [
  {
    id: 'tests',
    label: '跑通测试',
    text: '把这个仓库的测试跑通',
  },
  {
    id: 'subscribe',
    label: '落地页订阅',
    text: '给落地页加一个邮箱订阅表单',
  },
  {
    id: 'lint',
    label: '修复 Lint',
    text: '检查并修复 lint 错误',
  },
];

/**
 * Primary intent input: examples, submit with toast, navigate to Run View on success.
 */
export default function CommandBar({
  onTaskSubmitted,
  onPlanReady,
  className,
  showExamples = true,
  enablePlanPreview = true,
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const textareaRef = useRef(null);

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
          title: '额度不足',
          description: `${quota.reason} — 请前往 Usage 页升级套餐`,
        });
        return;
      }
      if (enablePlanPreview && onPlanReady) {
        const plan = await createPlan(text);
        const pipeline = planToPreviewPipeline(text, plan);
        if (pipeline?.steps?.length) {
          toast({
            title: '计划已生成',
            description: '请确认步骤与风险标注后 Launch',
          });
          await onPlanReady({ pipeline, planId: plan.plan_id, intent: text });
          setMessage('');
          return;
        }
      }

      const { taskId } = await submitEngineTask(text);
      if (!taskId) {
        throw new Error('后端已响应但缺少 task_id，无法打开运行视图');
      }

      toast({
        title: '任务已提交',
        description: '正在打开运行视图…',
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
        title: '提交失败',
        description:
          err instanceof Error
            ? err.message
            : '无法连接 Engine，请检查连接指示器是否为绿色',
      });
    } finally {
      setLoading(false);
    }
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
            placeholder="描述你要 AI 做什么… 例如：把这个仓库的测试跑通"
            className="flex-1 bg-transparent text-white placeholder:text-white/30 resize-none outline-none text-[15px] min-h-[72px] max-h-[160px]"
            rows={3}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between px-4 pb-4 gap-3 flex-wrap">
          <p className="text-[10px] text-white/25">Enter 提交 · Shift+Enter 换行</p>
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
            {loading ? '提交中…' : '提交并运行'}
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
              const tpl = templates.find((t) => t.id === id);
              if (tpl?.steps?.[0]) {
                const first = tpl.steps[0];
                const hint =
                  first.title || first.name || (typeof first === 'string' ? first : '');
                if (hint && onPlanReady) {
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
              <SelectValue placeholder="从模板开始" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showExamples && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/35 uppercase tracking-wider">示例任务</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {EXAMPLE_TASKS.map((ex) => (
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
