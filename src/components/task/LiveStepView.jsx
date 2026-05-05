import React from 'react';
import { CheckCircle2, Loader2, Clock, AlertTriangle, XCircle, ArrowRight, Shield, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const statusStyles = {
  completed: { icon: CheckCircle2, ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  running: { icon: Loader2, ring: 'ring-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-400', spin: true },
  queued: { icon: Clock, ring: 'ring-white/10', bg: 'bg-white/[0.03]', text: 'text-white/30' },
  awaiting_approval: { icon: Shield, ring: 'ring-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  failed: { icon: XCircle, ring: 'ring-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
};

const agentColors = {
  Planner: '#3B82F6', Researcher: '#8B5CF6', Coder: '#10B981',
  Writer: '#F59E0B', Operator: '#EF4444', Reviewer: '#06B6D4',
};

export default function LiveStepView({ nodes = [] }) {
  if (nodes.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-white/60">Pipeline Steps</h3>
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {nodes.filter(n => n.status === 'completed').length}</span>
          <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 text-blue-400" /> {nodes.filter(n => n.status === 'running').length}</span>
          {nodes.some(n => n.status === 'failed') && (
            <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> {nodes.filter(n => n.status === 'failed').length}</span>
          )}
        </div>
      </div>
      <div className="flex items-start gap-2 overflow-x-auto pb-2">
        {nodes.map((node, i) => {
          const s = statusStyles[node.status] || statusStyles.queued;
          const NodeIcon = s.icon;
          const color = agentColors[node.agent] || '#6B7280';
          return (
            <React.Fragment key={node.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "flex-shrink-0 w-[160px] p-3 rounded-xl ring-1 transition-all",
                  s.ring, s.bg,
                  node.status === 'running' && "shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <NodeIcon className={cn("w-3.5 h-3.5", s.text, s.spin && "animate-spin")} />
                    <span className="text-[10px] font-medium text-white/50 capitalize">{node.status?.replace('_', ' ')}</span>
                  </div>
                  {node.retry_count > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
                      <RotateCcw className="w-2.5 h-2.5" /> {node.retry_count}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-white truncate mb-1.5">{node.label}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ backgroundColor: color + '30', color }}>
                    {node.agent?.[0]}
                  </div>
                  <span className="text-[9px] text-white/35">{node.agent}</span>
                </div>
                {node.status === 'completed' && (
                  <div className="flex items-center gap-2 mt-2 text-[9px] text-white/25">
                    <span>{(node.duration_ms / 1000).toFixed(1)}s</span>
                    <span>{node.tokens} tok</span>
                    <span className="text-emerald-400/60">${node.cost.toFixed(4)}</span>
                  </div>
                )}
                {node.status === 'failed' && node.error_message && (
                  <p className="text-[9px] text-red-400/60 mt-2 truncate">{node.error_message}</p>
                )}
                {node.status === 'running' && (
                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mt-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      style={{ width: '50%' }}
                    />
                  </div>
                )}
              </motion.div>
              {i < nodes.length - 1 && (
                <ArrowRight className={cn(
                  "w-4 h-4 flex-shrink-0 mt-6",
                  node.status === 'completed' ? "text-emerald-400/40" : "text-white/10"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}