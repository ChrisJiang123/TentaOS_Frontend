import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Download, FileText, ChevronDown, ChevronUp, Check, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function StepOutput({ step, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(step.output || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!step.output) return null;

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
          style={{ backgroundColor: '#3B82F620', color: '#3B82F6' }}
        >
          {index + 1}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-medium text-white truncate">{step.role}: {step.task}</p>
          <p className="text-[10px] text-white/30">{step.model_used} · {step.tokens_used} tokens · ${(step.cost_usd || 0).toFixed(4)}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 text-[10px] text-white/40 hover:text-white/70"
                >
                  {copied ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-[13px] leading-relaxed [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_p]:text-white/60 [&_li]:text-white/60 [&_strong]:text-white/80 [&_code]:text-blue-300 [&_code]:bg-white/5 [&_code]:px-1 [&_code]:rounded">
                <ReactMarkdown>{step.output}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResultViewer({ pipelineRun }) {
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!pipelineRun || !pipelineRun.steps) return null;

  const completedSteps = pipelineRun.steps.filter(s => s.status === 'completed' && s.output);

  if (completedSteps.length === 0) return null;

  const handleCopyAll = () => {
    const allText = completedSteps.map(s => `## ${s.role}: ${s.task}\n\n${s.output}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(allText);
  };

  const handleDownloadMd = () => {
    const allText = completedSteps.map(s => `## ${s.role}: ${s.task}\n\n${s.output}`).join('\n\n---\n\n');
    const blob = new Blob([allText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pipelineRun.pipeline_name || 'result'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    setEmailSending(true);
    const allText = completedSteps.map(s => `## ${s.role}: ${s.task}\n\n${s.output}`).join('\n\n---\n\n');
    await base44.functions.invoke('sendResultEmail', {
      pipeline_name: pipelineRun.pipeline_name || 'Pipeline Result',
      content: allText,
    });
    setEmailSending(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-medium text-white">执行结果</h3>
          <span className="text-[10px] text-white/30">{completedSteps.length} 个步骤</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleCopyAll} className="h-7 text-[10px] text-white/40 hover:text-white/70">
            <Copy className="w-3 h-3 mr-1" /> 复制全部
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDownloadMd} className="h-7 text-[10px] text-white/40 hover:text-white/70">
            <Download className="w-3 h-3 mr-1" /> 下载 .md
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSendEmail}
            disabled={emailSending}
            className="h-7 text-[10px] text-white/40 hover:text-white/70"
          >
            {emailSending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : emailSent ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Mail className="w-3 h-3 mr-1" />}
            {emailSent ? '已发送' : '发到邮箱'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {completedSteps.map((step, i) => (
          <StepOutput key={step.step_id || i} step={step} index={i} />
        ))}
      </div>
    </div>
  );
}