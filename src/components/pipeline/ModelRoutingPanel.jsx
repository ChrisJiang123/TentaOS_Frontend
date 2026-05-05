import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Cpu, Zap, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const modelIcons = {
  'anthropic/claude-sonnet-4': '🟠',
  'openai/gpt-4o': '🟢',
  'openai/gpt-4o-mini': '🟢',
  'google/gemini-2.5-flash': '🔵',
  'deepseek/deepseek-chat': '🟣',
};

export default function ModelRoutingPanel({ taskDescription, onRouteSelected }) {
  const [routing, setRouting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [budgetMode, setBudgetMode] = useState('balanced');

  const getRouting = async () => {
    if (!taskDescription) return;
    setLoading(true);
    const res = await base44.functions.invoke('routeModel', {
      description: taskDescription,
      budget_mode: budgetMode,
      estimated_tokens: 3000,
    });
    setRouting(res.data.routing);
    setLoading(false);
    setExpanded(true);
    if (onRouteSelected) onRouteSelected(res.data.routing);
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => routing ? setExpanded(!expanded) : getRouting()}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium text-white/70">Model Routing Intelligence</span>
          {routing && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
              {routing.recommended.display_name} ({routing.recommended.score}/100)
            </span>
          )}
        </div>
        {loading ? (
          <Cpu className="w-4 h-4 text-purple-400 animate-spin" />
        ) : expanded ? (
          <ChevronUp className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30" />
        )}
      </button>

      <AnimatePresence>
        {expanded && routing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06]"
          >
            <div className="p-4 space-y-4">
              {/* Budget mode selector */}
              <div>
                <label className="text-[10px] text-white/40 mb-2 block">Cost Preference</label>
                <div className="flex gap-2">
                  {['minimum', 'balanced', 'maximum'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setBudgetMode(mode); }}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-all capitalize",
                        budgetMode === mode
                          ? "border-purple-500/40 bg-purple-500/10 text-purple-400"
                          : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:bg-white/[0.04]"
                      )}
                    >
                      {mode === 'minimum' ? '💰 Cheapest' : mode === 'balanced' ? '⚖️ Balanced' : '🏆 Best Quality'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task classification */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-white/40">Type:</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 capitalize">{routing.task_type}</span>
                <span className="text-white/40">Complexity:</span>
                <span className="text-white/60">{Math.round(routing.complexity * 100)}%</span>
              </div>

              {/* Explanation */}
              <p className="text-[11px] text-white/40 leading-relaxed">{routing.explanation}</p>

              {/* Model rankings */}
              <div className="space-y-2">
                {routing.all_models.map((model, i) => (
                  <div
                    key={model.model}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      i === 0 ? "border-purple-500/30 bg-purple-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"
                    )}
                  >
                    <span className="text-lg">{modelIcons[model.model] || '⚪'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">{model.display_name}</span>
                        {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">RECOMMENDED</span>}
                      </div>
                      <p className="text-[10px] text-white/30">{model.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-white">{model.score}/100</p>
                      <p className="text-[10px] text-white/30">${model.estimated_cost.toFixed(4)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={getRouting}
                className="w-full py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[11px] text-white/50 transition-colors"
              >
                Re-analyze with {budgetMode} preference
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}