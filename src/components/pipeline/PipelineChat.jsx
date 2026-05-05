import React, { useState, useRef } from 'react';
import engineClient from '@/lib/engineClient';
import { Sparkles, Loader2, Play, DollarSign, Clock, Cpu, Coins, Shield, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import QuickCommands, { commands } from './QuickCommands';
import StepEditor from './StepEditor';

const CHEAP_MODELS = ['deepseek/deepseek-chat', 'openai/gpt-4o-mini', 'google/gemini-2.5-flash'];

export default function PipelineChat({
  onEngineTaskSubmitted,
  approvalMode,
  onApprovalToggle,
}) {
  const [message, setMessage] = useState('');
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [budgetMode, setBudgetMode] = useState('balanced');
  const [showCommands, setShowCommands] = useState(false);
  const [history, setHistory] = useState([]); // conversation context
  const textareaRef = useRef(null);

  const handleGenerate = async () => {
    // base44 的“设计流水线”云函数已移除：这里直接提交到 Engine
    await handleDirectEngineSubmit();
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

  const notifyEngineTask = async (text, pipelineMeta) => {
    const res = await engineClient.submitTask(text);
    const taskId = res?.task_id ?? res?.taskId ?? res?.id;
    if (taskId && onEngineTaskSubmitted) {
      onEngineTaskSubmitted(taskId, text, pipelineMeta);
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const handleDirectEngineSubmit = async () => {
    if (!message.trim()) return;
    const text = message.trim();
    try {
      await notifyEngineTask(text, null);
    } catch (err) {
      console.error('Engine submit failed:', err);
      return;
    }
    setMessage('');
    setPipeline(null);
    setHistory([]);
  };

  const handleLaunch = async () => {
    if (!pipeline) return;
    const text = message.trim() || pipeline.pipeline_name || 'Run pipeline';
    try {
      await notifyEngineTask(text, pipeline);
    } catch (err) {
      console.error('Engine submit failed:', err);
      return;
    }
    setMessage('');
    setPipeline(null);
    setHistory([]);
  };

  return (
    <div className="space-y-4">
      {/* Submission confirmation */}
      {submitted && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">任务已提交，正在执行...</span>
        </div>
      )}

      {/* Input area */}
      <div className={cn(
        "relative rounded-2xl border transition-all duration-300",
        loading ? "border-purple-500/30 bg-white/[0.04]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
      )}>
        {/* Quick Commands Popup */}
        <QuickCommands visible={showCommands} onSelect={handleCommandSelect} />

        <div className="flex items-start p-4 gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            placeholder="描述你要 AI 团队做什么… 输入 / 查看快捷指令"
            className="flex-1 bg-transparent text-white placeholder:text-white/30 resize-none outline-none text-[15px] min-h-[60px] max-h-[150px]"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
              if (e.key === 'Escape') setShowCommands(false);
            }}
          />
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            {/* Budget mode */}
            <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
              {[
                { key: 'minimum', label: '💰', tip: '最便宜' },
                { key: 'balanced', label: '⚖️', tip: '均衡' },
                { key: 'maximum', label: '🏆', tip: '最好' },
              ].map(b => (
                <button
                  key={b.key}
                  onClick={() => setBudgetMode(b.key)}
                  title={b.tip}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs transition-all",
                    budgetMode === b.key ? "bg-white/[0.1] text-white" : "text-white/30 hover:text-white/50"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-white/20">
              {budgetMode === 'minimum' ? '成本优先' : budgetMode === 'maximum' ? '质量优先' : '均衡'}
            </span>
            {/* Approval gate toggle */}
            <button
              onClick={() => onApprovalToggle && onApprovalToggle(!approvalMode)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all ml-1",
                approvalMode ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "text-white/25 hover:text-white/40"
              )}
              title="Approval gates — pause before high-risk steps"
            >
              <Shield className="w-3 h-3" />
              {approvalMode ? '审批开' : '审批'}
            </button>
            {history.length > 0 && (
              <span className="text-[10px] text-purple-400/50 ml-2">
                对话 #{history.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              onClick={handleDirectEngineSubmit}
              disabled={!message.trim() || loading}
              size="sm"
              variant="outline"
              className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 rounded-lg px-3 h-8 text-xs font-medium disabled:opacity-30"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              直接提交引擎
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!message.trim() || loading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-4 h-8 text-xs font-medium disabled:opacity-30"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5 mr-1.5" />}
              {loading ? '设计中…' : '设计流水线'}
            </Button>
          </div>
        </div>
      </div>

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
            {/* base44 ModelRoutingPanel 已移除 */}

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