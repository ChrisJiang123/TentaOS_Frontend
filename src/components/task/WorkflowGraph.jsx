import React from 'react';
import { CheckCircle2, Loader2, Clock, AlertTriangle, ArrowRight, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const statusStyles = {
  completed: { icon: CheckCircle2, ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  running: { icon: Loader2, ring: 'ring-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-400', spin: true },
  queued: { icon: Clock, ring: 'ring-white/10', bg: 'bg-white/[0.03]', text: 'text-white/30' },
  awaiting_approval: { icon: AlertTriangle, ring: 'ring-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  failed: { icon: XCircle, ring: 'ring-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
};

const agentColors = {
  Planner: '#3B82F6',
  Researcher: '#8B5CF6',
  Coder: '#10B981',
  Writer: '#F59E0B',
  Operator: '#EF4444',
  Reviewer: '#06B6D4',
};

export default function WorkflowGraph({ nodes = [], onNodeClick }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
      <h3 className="text-sm font-medium text-white/60 mb-5">Workflow Execution</h3>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {nodes.map((node, i) => {
          const s = statusStyles[node.status] || statusStyles.queued;
          const NodeIcon = s.icon;
          const color = agentColors[node.agent] || '#6B7280';
          return (
            <React.Fragment key={node.id}>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => onNodeClick?.(node)}
                className={cn(
                  "flex-shrink-0 w-[140px] p-3 rounded-xl ring-1 transition-all hover:scale-[1.02]",
                  s.ring, s.bg,
                  "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <NodeIcon className={cn("w-3.5 h-3.5", s.text, s.spin && "animate-spin")} />
                  <span className="text-[11px] font-medium text-white/60 capitalize">{node.status}</span>
                </div>
                <p className="text-xs font-medium text-white truncate">{node.label}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: color + '30', color }}>
                    {node.agent?.[0]}
                  </div>
                  <span className="text-[10px] text-white/40">{node.agent}</span>
                </div>
                {node.duration_ms > 0 && (
                  <p className="text-[10px] text-white/25 mt-1.5">{(node.duration_ms / 1000).toFixed(1)}s · {node.tokens} tok</p>
                )}
              </motion.button>
              {i < nodes.length - 1 && (
                <ArrowRight className="w-4 h-4 text-white/15 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}