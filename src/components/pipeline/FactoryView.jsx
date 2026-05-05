import React from 'react';
import { CheckCircle2, Loader2, Clock, AlertTriangle, ArrowRight, Cpu, Zap, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const statusConfig = {
  pending: { icon: Clock, color: 'text-white/30', bg: 'border-white/10', ringColor: '' },
  queued: { icon: Clock, color: 'text-white/30', bg: 'border-white/10', ringColor: '' },
  running: { icon: Loader2, color: 'text-blue-400', bg: 'border-blue-500/40', ringColor: 'ring-blue-500/20', spin: true },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'border-emerald-500/30', ringColor: '' },
  failed: { icon: AlertTriangle, color: 'text-red-400', bg: 'border-red-500/30', ringColor: '' },
};

const roleColors = {
  Planner: '#3B82F6',
  Researcher: '#10B981',
  Writer: '#8B5CF6',
  Coder: '#F59E0B',
  Reviewer: '#EC4899',
  Operator: '#06B6D4',
};

function StepNode({ node, index }) {
  const status = statusConfig[node.status] || statusConfig.pending;
  const Icon = status.icon;
  const roleColor = roleColors[node.agent] || '#6B7280';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative bg-white/[0.03] border-2 rounded-xl p-4 min-w-[180px] transition-all",
        status.bg,
        status.ringColor && "ring-2 " + status.ringColor,
        node.status === 'running' && "shadow-[0_0_20px_rgba(59,130,246,0.15)]"
      )}
    >
      {/* Agent avatar */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: roleColor + '20', color: roleColor }}
        >
          {node.agent?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">{node.agent}</p>
          <p className="text-[10px] text-white/30 truncate">{node.model || 'auto'}</p>
        </div>
        <Icon className={cn("w-4 h-4 flex-shrink-0", status.color, status.spin && "animate-spin")} />
      </div>

      {/* Task description */}
      <p className="text-[11px] text-white/50 line-clamp-2 mb-3">{node.label}</p>

      {/* Metrics (shown when completed) */}
      {node.status === 'completed' && (
        <div className="flex items-center gap-3 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" /> {node.tokens || 0}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> ${(node.cost || 0).toFixed(4)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {((node.duration_ms || 0) / 1000).toFixed(1)}s
          </span>
        </div>
      )}

      {/* Running animation */}
      {node.status === 'running' && (
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: '50%' }}
          />
        </div>
      )}
    </motion.div>
  );
}

function ConveyorBelt({ active }) {
  return (
    <div className="flex items-center justify-center px-2 flex-shrink-0">
      <div className="flex items-center gap-1">
        <div className={cn("w-6 h-0.5 rounded-full transition-colors", active ? "bg-emerald-500/50" : "bg-white/10")} />
        <ArrowRight className={cn("w-4 h-4 transition-colors", active ? "text-emerald-400" : "text-white/15")} />
      </div>
    </div>
  );
}

export default function FactoryView({ workflowNodes = [], pipelineName, estimatedCost, totalCost, totalTokens }) {
  if (!workflowNodes || workflowNodes.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-medium text-white">{pipelineName || 'Pipeline'}</h3>
            <p className="text-[11px] text-white/30">
              {workflowNodes.filter(n => n.status === 'completed').length}/{workflowNodes.length} steps
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          {estimatedCost > 0 && (
            <span className="text-white/30">Est: ${estimatedCost.toFixed(3)}</span>
          )}
          {totalCost > 0 && (
            <span className="text-emerald-400 font-medium">Actual: ${totalCost.toFixed(4)}</span>
          )}
          {totalTokens > 0 && (
            <span className="text-purple-400">{totalTokens.toLocaleString()} tokens</span>
          )}
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="flex items-start overflow-x-auto pb-2 gap-0">
        {workflowNodes.map((node, i) => (
          <React.Fragment key={node.id || i}>
            <StepNode node={node} index={i} />
            {i < workflowNodes.length - 1 && (
              <ConveyorBelt active={node.status === 'completed'} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}