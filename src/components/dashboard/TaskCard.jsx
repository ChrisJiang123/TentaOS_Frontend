import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Clock, AlertTriangle, Pause, XCircle, ArrowRight, Bot, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  queued: { icon: Clock, color: 'text-white/40', bg: 'bg-white/5', label: 'Queued' },
  planning: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Planning', spin: true },
  running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Running', spin: true },
  paused: { icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Paused' },
  awaiting_approval: { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Awaiting Approval' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'text-white/40', bg: 'bg-white/5', label: 'Cancelled' },
};

const packColors = {
  growth: 'text-purple-400 bg-purple-500/10',
  builder: 'text-emerald-400 bg-emerald-500/10',
  custom: 'text-white/40 bg-white/5',
};

export default function TaskCard({ task }) {
  const status = statusConfig[task.status] || statusConfig.queued;
  const StatusIcon = status.icon;
  const progress = task.steps_total > 0 ? (task.steps_completed / task.steps_total) * 100 : 0;

  const timeAgo = task.created_date ? formatDistanceToNow(new Date(task.created_date), { addSuffix: true }) : '';

  const agentCount = task.assigned_agents?.length || 0;

  return (
    <Link to={`/TaskDetail?id=${task.id}`} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200",
          task.status === 'failed' && "border-red-500/10",
          (task.status === 'running' || task.status === 'planning') && "border-blue-500/10"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-medium text-white truncate group-hover:text-blue-300 transition-colors">
              {task.title}
            </h3>
            <p className="text-xs text-white/40 mt-1 line-clamp-1">{task.goal}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-all ml-3 mt-1 flex-shrink-0 group-hover:translate-x-0.5" />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md", status.bg)}>
            <StatusIcon className={cn("w-3 h-3", status.color, status.spin && "animate-spin")} />
            <span className={status.color}>{status.label}</span>
          </div>
          {task.pack && (
            <span className={cn("px-2 py-1 rounded-md text-[11px] capitalize", packColors[task.pack])}>
              {task.pack}
            </span>
          )}
          {task.priority && task.priority !== 'medium' && (
            <span className={cn(
              "px-2 py-1 rounded-md text-[11px] capitalize",
              task.priority === 'high' ? 'text-amber-400 bg-amber-500/10' : 'text-white/40 bg-white/5'
            )}>
              {task.priority}
            </span>
          )}
          {agentCount > 0 && (
            <span className="flex items-center gap-1 text-white/25">
              <Bot className="w-3 h-3" /> {agentCount}
            </span>
          )}
          <span className="text-white/20 ml-auto flex items-center gap-2">
            {task.actual_cost > 0 && <span>${task.actual_cost.toFixed(2)}</span>}
            {timeAgo && <span>{timeAgo}</span>}
          </span>
        </div>

        {(task.status === 'running' || task.status === 'planning') && task.steps_total > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-white/30 mb-1.5">
              <span>Step {task.steps_completed}/{task.steps_total}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {task.status === 'awaiting_approval' && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[11px] text-amber-400/70">Waiting for your approval to continue</p>
          </div>
        )}

        {task.status === 'failed' && (task.execution_log?.length > 0 || task.timeline?.length > 0) && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
            <p className="text-[11px] text-red-400/70 line-clamp-1">
              {(task.execution_log || task.timeline || []).filter(e => e.level === 'error' || e.type === 'error').slice(-1)[0]?.detail || 'Task failed'}
            </p>
          </div>
        )}
      </motion.div>
    </Link>
  );
}