import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Save, X, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODELS = [
  { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', tip: '写作最强 $$' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', tip: '多模态 $$' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini Flash', tip: '最快最便宜 $' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek', tip: '代码/数学 $' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', tip: '简单任务 $' },
];

const DEFAULT_PROMPTS = {
  planner: "You are a project planner. Break down complex goals into actionable steps with time estimates. Be specific and practical.",
  researcher: "You are a research analyst. Collect, organize, and verify information. Provide sources, data, and conclusions. Do not fabricate information.",
  writer: "You are a professional writer. Transform input material into clear, persuasive text. Focus on structure, logic, and readability.",
  coder: "You are a software engineer. Write clean, runnable, well-commented code. Include error handling.",
  reviewer: "You are a quality reviewer. Check input material for accuracy, logic gaps, and quality issues. Point out problems and suggest fixes.",
  operator: "You are an operations expert. Execute specific operational actions. Output concrete executable steps.",
};

export default function AgentEditor({ agent, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: agent.name || '',
    system_prompt: agent.system_prompt || '',
    model_id: agent.model_id || 'openai/gpt-4o-mini',
    temperature: agent.temperature ?? 0.7,
    permission_level: agent.permission_level || 'execute',
    max_retries: agent.max_retries ?? 2,
    capabilities: agent.capabilities || [],
    cost_limit: agent.cost_limit ?? 10,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Agent.update(agent.id, form);
    setSaving(false);
    onSave();
  };

  const handleResetPrompt = () => {
    setForm({ ...form, system_prompt: DEFAULT_PROMPTS[agent.role] || '' });
  };

  return (
    <div className="border-t border-white/[0.06] p-5 space-y-4">
      {/* Name */}
      <div>
        <label className="text-xs text-white/50 mb-1.5 block">Agent Name</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="bg-white/[0.04] border-white/[0.08] text-white"
        />
      </div>

      {/* System Prompt */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-white/50">System Prompt</label>
          <button
            onClick={handleResetPrompt}
            className="text-[10px] text-white/30 hover:text-white/50 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset to default
          </button>
        </div>
        <Textarea
          value={form.system_prompt}
          onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
          placeholder="Instructions for this agent..."
          className="bg-white/[0.04] border-white/[0.08] text-white h-32 font-mono text-xs"
        />
      </div>

      {/* Model + Permission */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Model</label>
          <Select value={form.model_id} onValueChange={(v) => setForm({ ...form, model_id: v })}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/10">
              {MODELS.map(m => (
                <SelectItem key={m.id} value={m.id} className="text-white/70 text-xs">
                  {m.label} <span className="text-white/30 ml-1">({m.tip})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Permission</label>
          <Select value={form.permission_level} onValueChange={(v) => setForm({ ...form, permission_level: v })}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/10">
              {['observe', 'suggest', 'execute', 'autonomous'].map(p => (
                <SelectItem key={p} value={p} className="capitalize text-white/70 text-xs">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <label className="text-xs text-white/50 mb-1.5 block">Capabilities</label>
        <div className="flex flex-wrap gap-2">
          {['web_search', 'code_execution', 'data_analysis', 'email_draft', 'file_operations'].map(cap => (
            <button
              key={cap}
              onClick={() => {
                const caps = form.capabilities.includes(cap)
                  ? form.capabilities.filter(c => c !== cap)
                  : [...form.capabilities, cap];
                setForm({ ...form, capabilities: caps });
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] border transition-all",
                form.capabilities.includes(cap)
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                  : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
              )}
            >
              {cap.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Retries + Cost Limit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Max Retries</label>
          <Select value={String(form.max_retries)} onValueChange={(v) => setForm({ ...form, max_retries: parseInt(v) })}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/10">
              {[0, 1, 2, 3].map(n => (
                <SelectItem key={n} value={String(n)} className="text-white/70 text-xs">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Cost Limit ($)</label>
          <Input
            type="number"
            value={form.cost_limit}
            onChange={(e) => setForm({ ...form, cost_limit: parseFloat(e.target.value) || 0 })}
            className="bg-white/[0.04] border-white/[0.08] text-white text-xs"
          />
        </div>
      </div>

      {/* Temperature */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/50">Temperature</label>
          <span className="text-xs text-white/70 font-mono">{form.temperature.toFixed(1)}</span>
        </div>
        <Slider
          value={[form.temperature]}
          onValueChange={([v]) => setForm({ ...form, temperature: v })}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-white/25 mt-1">
          <span>0 = 严格精确</span>
          <span>0.5 = 平衡</span>
          <span>1.0 = 创意发散</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-white/40 h-8 text-xs"
        >
          <X className="w-3 h-3 mr-1" /> Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 h-8 text-xs"
        >
          {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}