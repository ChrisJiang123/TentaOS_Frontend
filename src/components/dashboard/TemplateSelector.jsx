import React, { useState } from 'react';
import { Newspaper, Search, FileText, Mail, Code2, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const TEMPLATES = [
  {
    id: 'daily-briefing',
    icon: Newspaper,
    color: '#3B82F6',
    name: '📰 每日行业简报',
    nameEn: 'Daily Briefing',
    description: '搜索真实新闻，生成行业简报',
    input_placeholder: '输入关注的行业（如：AI、SaaS、跨境电商）',
    pipeline: {
      pipeline_name: '每日行业简报',
      description: '搜索+筛选+撰写行业简报',
      steps: [
        { step_id: 'step_1', role: 'Researcher', task: '搜索该领域最近24小时的重要新闻和动态', recommended_model: 'google/gemini-2.5-flash', needs_search: true, estimated_cost_usd: 0.002 },
        { step_id: 'step_2', role: 'Researcher', task: '筛选和分类收集到的资讯，按重要程度排序', recommended_model: 'openai/gpt-4o-mini', estimated_cost_usd: 0.001 },
        { step_id: 'step_3', role: 'Writer', task: '将筛选后的资讯整理成简洁的晨报格式，包含来源链接', recommended_model: 'anthropic/claude-sonnet-4', estimated_cost_usd: 0.005 },
        { step_id: 'step_4', role: 'Reviewer', task: '检查晨报内容的准确性和可读性', recommended_model: 'deepseek/deepseek-chat', estimated_cost_usd: 0.001 },
      ],
      total_estimated_cost_usd: 0.009,
      estimated_duration_seconds: 90,
    },
  },
  {
    id: 'competitor-analysis',
    icon: Search,
    color: '#8B5CF6',
    name: '🔍 竞品分析报告',
    nameEn: 'Competitor Analysis',
    description: '深度分析竞品功能、定价、优劣势',
    input_placeholder: '输入竞品名称（如：Notion, Linear, Slack）',
    pipeline: {
      pipeline_name: '竞品分析报告',
      description: '搜索+分析+报告生成',
      steps: [
        { step_id: 'step_1', role: 'Researcher', task: '搜索竞品的产品功能、定价、用户评价', recommended_model: 'google/gemini-2.5-flash', needs_search: true, estimated_cost_usd: 0.002 },
        { step_id: 'step_2', role: 'Planner', task: '对比分析各竞品的优势、劣势、差异化', recommended_model: 'anthropic/claude-sonnet-4', estimated_cost_usd: 0.005 },
        { step_id: 'step_3', role: 'Writer', task: '生成结构化的竞品分析报告，包含对比表格', recommended_model: 'anthropic/claude-sonnet-4', estimated_cost_usd: 0.005 },
        { step_id: 'step_4', role: 'Reviewer', task: '检查报告的逻辑性和结论是否有数据支撑', recommended_model: 'deepseek/deepseek-chat', estimated_cost_usd: 0.001 },
      ],
      total_estimated_cost_usd: 0.013,
      estimated_duration_seconds: 120,
    },
  },
  {
    id: 'blog-post',
    icon: FileText,
    color: '#10B981',
    name: '✍️ 博客文章生成',
    nameEn: 'Blog Post',
    description: '从调研到成稿，自动生成一篇有深度的文章',
    input_placeholder: '输入文章主题（如：AI Agent 是下一个大机会）',
    pipeline: {
      pipeline_name: '博客文章生成',
      description: '调研+大纲+撰写+审查+修改',
      steps: [
        { step_id: 'step_1', role: 'Researcher', task: '搜索主题相关的最新数据、案例、观点', recommended_model: 'google/gemini-2.5-flash', needs_search: true, estimated_cost_usd: 0.002 },
        { step_id: 'step_2', role: 'Planner', task: '基于调研结果设计文章大纲（标题、副标题、关键论点）', recommended_model: 'anthropic/claude-sonnet-4', estimated_cost_usd: 0.003 },
        { step_id: 'step_3', role: 'Writer', task: '按大纲写出完整的博客文章，1500-2000字', recommended_model: 'anthropic/claude-sonnet-4', estimated_cost_usd: 0.008 },
        { step_id: 'step_4', role: 'Reviewer', task: '审查文章质量：逻辑、可读性、SEO 友好度', recommended_model: 'deepseek/deepseek-chat', estimated_cost_usd: 0.001 },
        { step_id: 'step_5', role: 'Writer', task: '根据审查意见修改文章，输出最终版', recommended_model: 'anthropic/claude-sonnet-4', estimated_cost_usd: 0.005 },
      ],
      total_estimated_cost_usd: 0.019,
      estimated_duration_seconds: 150,
    },
  },
  {
    id: 'cold-email',
    icon: Mail,
    color: '#F59E0B',
    name: '📧 冷邮件序列',
    nameEn: 'Cold Email Sequence',
    description: '生成 3-5 封渐进式冷邮件，附带个性化策略',
    input_placeholder: '输入目标客户（如：SaaS CEO，需要 AI 自动化）',
    pipeline: {
      pipeline_name: '冷邮件序列',
      description: '分析痛点+撰写邮件+审查',
      steps: [
        { step_id: 'step_1', role: 'Researcher', task: '分析目标客户的典型痛点和购买动机', recommended_model: 'anthropic/claude-sonnet-4', estimated_cost_usd: 0.003 },
        { step_id: 'step_2', role: 'Writer', task: '生成 5 封渐进式冷邮件（第1封建立联系→第5封促成行动）', recommended_model: 'anthropic/claude-sonnet-4', estimated_cost_usd: 0.008 },
        { step_id: 'step_3', role: 'Reviewer', task: '检查邮件的说服力、长度、CTA 清晰度', recommended_model: 'deepseek/deepseek-chat', estimated_cost_usd: 0.001 },
      ],
      total_estimated_cost_usd: 0.012,
      estimated_duration_seconds: 60,
    },
  },
  {
    id: 'code-review',
    icon: Code2,
    color: '#EC4899',
    name: '🔧 代码审查',
    nameEn: 'Code Review',
    description: '安全性、性能、可维护性全面审查',
    input_placeholder: '粘贴你的代码',
    pipeline: {
      pipeline_name: '代码审查',
      description: '安全审查+性能审查+报告整合',
      steps: [
        { step_id: 'step_1', role: 'Reviewer', task: '审查代码的安全漏洞（SQL注入、XSS、硬编码密钥等）', recommended_model: 'anthropic/claude-sonnet-4', estimated_cost_usd: 0.005 },
        { step_id: 'step_2', role: 'Reviewer', task: '审查代码的性能问题和优化建议', recommended_model: 'deepseek/deepseek-chat', estimated_cost_usd: 0.002 },
        { step_id: 'step_3', role: 'Writer', task: '整合审查结果，生成带优先级的改进清单', recommended_model: 'openai/gpt-4o-mini', estimated_cost_usd: 0.001 },
      ],
      total_estimated_cost_usd: 0.008,
      estimated_duration_seconds: 60,
    },
  },
];

export default function TemplateSelector({ onSelect, isSubmitting = false }) {
  const [selectedId, setSelectedId] = useState(null);
  const [userInput, setUserInput] = useState('');

  const selected = TEMPLATES.find(t => t.id === selectedId);

  const handleLaunch = () => {
    if (!selected || !userInput.trim()) return;
    // Replace {input} in step tasks
    const pipeline = JSON.parse(JSON.stringify(selected.pipeline));
    pipeline.steps = pipeline.steps.map(s => ({
      ...s,
      task: s.task.replace('{input}', userInput.trim()),
    }));
    pipeline.pipeline_name = selected.name + ': ' + userInput.trim().slice(0, 40);
    onSelect(userInput.trim(), pipeline);
    setSelectedId(null);
    setUserInput('');
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <h3 className="text-sm font-medium text-white mb-1">⚡ 快速开始 — 选一个模板</h3>
      <p className="text-[11px] text-white/30 mb-4">点击模板 → 填关键词 → 一键运行</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEMPLATES.map((t) => (
          <motion.button
            key={t.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { setSelectedId(t.id === selectedId ? null : t.id); setUserInput(''); }}
            className={cn(
              "text-left p-4 rounded-xl border transition-all",
              selectedId === t.id
                ? "border-[#00E5FF]/30 bg-[#00E5FF]/[0.05]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <t.icon className="w-4 h-4" style={{ color: t.color }} />
              <span className="text-xs font-medium text-white">{t.name}</span>
            </div>
            <p className="text-[11px] text-white/40 mb-2">{t.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-white/25">
              <span>{t.pipeline.steps.length} 步</span>
              <span>·</span>
              <span>~${t.pipeline.total_estimated_cost_usd.toFixed(3)}</span>
              <span>·</span>
              <span>~{Math.round(t.pipeline.estimated_duration_seconds / 60)}分钟</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Input area when template selected */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl"
        >
          <p className="text-xs text-white/50 mb-2">{selected.name}</p>
          <div className="flex gap-3">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={selected.input_placeholder}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-sm text-white placeholder:text-white/25 resize-none outline-none min-h-[60px]"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleLaunch(); }
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-white/25">
              {selected.pipeline.steps.length} 步 · 预估 ${selected.pipeline.total_estimated_cost_usd.toFixed(3)} · ~{Math.round(selected.pipeline.estimated_duration_seconds / 60)} 分钟
            </span>
            <Button
              onClick={handleLaunch}
              disabled={!userInput.trim() || isSubmitting}
              size="sm"
              className="bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/80 h-8 text-xs font-semibold px-4 disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              {isSubmitting ? '提交中…' : '运行模板'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}