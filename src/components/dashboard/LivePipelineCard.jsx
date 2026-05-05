import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, Clock, DollarSign, Cpu, ArrowRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const agentColors = {
  Planner: '#3B82F6', Researcher: '#8B5CF6', Coder: '#10B981',
  Writer: '#F59E0B', Operator: '#EF4444', Reviewer: '#06B6D4',
};

export default function LivePipelineCard({ task }) {
  const nodes = task.workflow_nodes || [];
  const runningNode = nodes.find(n => n.status === 'running');
  const completedCount = nodes.filter(n => n.status === 'completed').length;
  const progress = nodes.length > 0 ? (completedCount / nodes.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] border border-blue-500/20 rounded-xl p-4 ring-1 ring-blue-500/10"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
        </div>
        <Link to={"/TaskDetail?id=" + task.id} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
          <Eye className="w-3 h-3" /> Detail
        </Link>
      </div>

      {/* Mini step progress */}
      <div className="flex items-center gap-1 mb-3">
        {nodes.map((node, i) => {
          const color = agentColors[node.agent] || '#6B7280';
          return (
            <div
              key={node.id}
              className={cn(
                "h-6 rounded-md flex items-center justify-center text-[8px] font-bold transition-all flex-1",
                node.status === 'completed' && "opacity-100",
                node.status === 'running' && "opacity-100 ring-1 ring-blue-500/40",
                node.status === 'queued' && "opacity-30",
                node.status === 'failed' && "opacity-100 ring-1 ring-red-500/40",
              )}
              style={{ backgroundColor: color + (node.status === 'queued' ? '10' : '25'), color }}
              title={node.agent + ': ' + node.label}
            >
              {node.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
              {node.status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
              {node.status === 'failed' && <XCircle className="w-3 h-3" />}
              {node.status === 'queued' && <span>{node.agent?.[0]}</span>}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
          animate={{ width: progress + '%' }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Current activity */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="text-white/40">
          {runningNode ? (
            <span className="text-blue-400">{runningNode.agent}: {runningNode.label}</span>
          ) : (
            <span>{completedCount}/{nodes.length} steps</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-white/30">
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {(task.tokens_used || 0).toLocaleString()}</span>
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${(task.actual_cost || 0).toFixed(3)}</span>
        </div>
      </div>
    </motion.div>
  );
}