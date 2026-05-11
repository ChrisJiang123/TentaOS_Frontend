import React, { useState } from 'react';
import { Pencil, Check, X, Shield } from 'lucide-react';

const MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini Flash', cost: '$', icon: '🔵' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', cost: '$', icon: '🟢' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek', cost: '$', icon: '🟣' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', cost: '$$', icon: '🟢' },
  { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet', cost: '$$$', icon: '🟠' },
];

const ROLES = ['Planner', 'Researcher', 'Writer', 'Coder', 'Reviewer', 'Operator'];

const roleColors = {
  Planner: '#3B82F6', Researcher: '#10B981', Writer: '#8B5CF6',
  Coder: '#F59E0B', Reviewer: '#EC4899', Operator: '#06B6D4',
};

export default function StepEditor({ step, index, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...step });
  const roleColor = roleColors[step.role] || '#6B7280';

  const handleSave = () => {
    onChange(index, draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({ ...step });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-3 rounded-xl bg-white/[0.04] border border-blue-500/20 space-y-3">
        {/* Task description */}
        <textarea
          value={draft.task}
          onChange={(e) => setDraft({ ...draft, task: e.target.value })}
          className="w-full bg-black/20 border border-white/[0.08] rounded-lg p-2.5 text-xs text-white resize-none outline-none min-h-[60px]"
          rows={2}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role selector */}
          <select
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            className="bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {/* Model selector */}
          <select
            value={draft.recommended_model}
            onChange={(e) => setDraft({ ...draft, recommended_model: e.target.value })}
            className="bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.icon} {m.label} ({m.cost})</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={handleSave} className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleCancel} className="p-1.5 rounded-md bg-white/[0.05] text-white/40 hover:bg-white/[0.1]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] group hover:border-white/[0.08] transition-colors">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: roleColor + '15', color: roleColor }}
      >
        {step.role?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white truncate">{step.task}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-white/30">{step.role}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/40">{step.recommended_model}</span>
          {step.needs_search && <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-400">🔍 search</span>}
          {step.needs_approval && <Shield className="w-3 h-3 text-amber-400" />}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/30 hover:text-white/60">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={() => onRemove(index)} className="p-1.5 rounded-md hover:bg-red-500/10 text-white/30 hover:text-red-400">
          <X className="w-3 h-3" />
        </button>
      </div>
      <span className="text-[10px] text-white/30 flex-shrink-0">${(step.estimated_cost_usd || 0).toFixed(3)}</span>
    </div>
  );
}