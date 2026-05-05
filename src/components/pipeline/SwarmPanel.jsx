import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bug, Play, Loader2, Trophy, DollarSign, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const modelIcons = {
  'anthropic/claude-sonnet-4': '🟠',
  'openai/gpt-4o': '🟢',
  'openai/gpt-4o-mini': '🟢',
  'google/gemini-2.5-flash': '🔵',
  'deepseek/deepseek-chat': '🟣',
};

export default function SwarmPanel() {
  const [task, setTask] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [keepTopN, setKeepTopN] = useState(2);

  const runSwarm = async () => {
    if (!task.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke('executeSwarm', {
      task_description: task.trim(),
      keep_top_n: keepTopN,
    });
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Bug className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium text-white">Swarm Mode</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
            Parallel Exploration
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-white/[0.06]"
          >
            <div className="p-4 space-y-4">
              <p className="text-[11px] text-white/40 leading-relaxed">
                Swarm mode sends your task to 5 different AI models in parallel, then a Critic (Claude) evaluates and ranks all candidates.
              </p>

              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g., Come up with 5 different marketing strategies for a SaaS product..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-sm text-white placeholder:text-white/25 resize-none outline-none min-h-[80px]"
                rows={3}
              />

              <div className="flex items-center gap-3">
                <label className="text-[11px] text-white/40">Keep top:</label>
                <div className="flex gap-1">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      onClick={() => setKeepTopN(n)}
                      className={cn(
                        "w-7 h-7 rounded-lg text-xs font-medium transition-all",
                        keepTopN === n ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/[0.03] text-white/40 border border-white/[0.06]"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={runSwarm}
                disabled={!task.trim() || loading}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white h-9 text-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                {loading ? 'Running 5 models in parallel...' : 'Launch Swarm'}
              </Button>

              {/* Results */}
              {result && result.swarm_result && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/50">
                      {result.swarm_result.candidates?.length || 0} candidates generated
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-purple-400">
                        <Zap className="w-3 h-3" /> {result.total_tokens?.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <DollarSign className="w-3 h-3" /> ${result.total_cost?.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Rankings */}
                  {result.swarm_result.rankings && (
                    <div className="space-y-2">
                      {result.swarm_result.rankings.map((rank, i) => {
                        const candidate = result.swarm_result.candidates?.[rank.candidate_index];
                        const isWinner = i < keepTopN;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "p-3 rounded-xl border transition-all",
                              isWinner ? "border-amber-500/30 bg-amber-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {isWinner && <Trophy className="w-4 h-4 text-amber-400" />}
                              <span className="text-lg">{modelIcons[candidate?.model_display] || '⚪'}</span>
                              <span className="text-xs font-medium text-white">{candidate?.model_display}</span>
                              <span className={cn("text-xs font-bold ml-auto", isWinner ? "text-amber-400" : "text-white/40")}>
                                {rank.total_score}/100
                              </span>
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-4">{candidate?.preview}</p>
                            <p className="text-[10px] text-white/30 mt-2 italic">{rank.reason}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}