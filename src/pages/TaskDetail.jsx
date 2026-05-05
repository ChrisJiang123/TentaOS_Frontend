import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, Cpu, Play, Pause, XCircle, RotateCcw, Trash2, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiveStepView from '../components/task/LiveStepView';
import ExecutionLog from '../components/task/ExecutionLog';
import ArtifactList from '../components/task/ArtifactList';
import FactoryView from '../components/pipeline/FactoryView';
import { cn } from '@/lib/utils';

const statusColors = {
  queued: 'bg-white/10 text-white/50',
  planning: 'bg-blue-500/10 text-blue-400',
  running: 'bg-blue-500/10 text-blue-400',
  paused: 'bg-amber-500/10 text-amber-400',
  awaiting_approval: 'bg-orange-500/10 text-orange-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-white/10 text-white/40',
};

export default function TaskDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => null,
    enabled: !!taskId,
  });

  const { data: pipelineRun } = useQuery({
    queryKey: ['pipelineRun', task?.workflow_id],
    queryFn: async () => null,
    enabled: !!task?.workflow_id,
  });

  // Real-time updates for this task
  useEffect(() => {
    return () => {};
  }, [taskId, queryClient]);

  // Real-time updates for pipeline run
  useEffect(() => {
    return () => {};
  }, [task?.workflow_id, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/40">
        <div className="text-center">
          <p>Task not found</p>
          <Link to="/Dashboard" className="text-blue-400 text-sm mt-2 block hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const progress = task.steps_total > 0 ? (task.steps_completed / task.steps_total) * 100 : 0;

  // Calculate duration
  const getDuration = () => {
    const start = task.started_at ? new Date(task.started_at) : null;
    const end = task.completed_at ? new Date(task.completed_at) : (task.status === 'running' || task.status === 'planning' ? new Date() : null);
    if (!start || !end) return null;
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const handleRetry = async () => {
    // base44 已移除：本地模式不支持在此页面重试
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task permanently?')) return;
    // base44 已移除：本地模式不支持在此页面删除
    window.location.href = '/Dashboard';
  };

  const duration = getDuration();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen p-6 lg:p-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/Dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">{task.title}</h1>
              <p className="text-sm text-white/40 mt-1 max-w-xl">{task.goal}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {task.status === 'running' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-white/60 hover:bg-white/5 h-8 text-xs"
                  onClick={async () => {
                    // base44 已移除：本地模式不支持在此页面暂停
                    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
                  }}
                >
                  <Pause className="w-3 h-3 mr-1" /> Pause
                </Button>
              )}
              {task.status === 'paused' && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white h-8 text-xs"
                  onClick={async () => {
                    // base44 已移除：本地模式不支持在此页面恢复
                    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
                  }}
                >
                  <Play className="w-3 h-3 mr-1" /> Resume
                </Button>
              )}
              {task.status === 'failed' && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white h-8 text-xs"
                  onClick={handleRetry}
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Retry
                </Button>
              )}
              {!['completed', 'cancelled', 'failed'].includes(task.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-8 text-xs"
                  onClick={async () => {
                    // base44 已移除：本地模式不支持在此页面取消
                    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
                  }}
                >
                  <XCircle className="w-3 h-3 mr-1" /> Cancel
                </Button>
              )}
              {['completed', 'failed', 'cancelled'].includes(task.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 h-8 text-xs"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize", statusColors[task.status])}>
            {task.status?.replace('_', ' ')}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock className="w-3.5 h-3.5" />
            <span>{task.steps_completed}/{task.steps_total} steps</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${(task.actual_cost || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Cpu className="w-3.5 h-3.5" />
            <span>{(task.tokens_used || 0).toLocaleString()} tokens</span>
          </div>
          {duration && (
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Timer className="w-3.5 h-3.5" />
              <span>{duration}</span>
            </div>
          )}
          {task.steps_total > 0 && (
            <div className="flex-1 max-w-xs">
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Step View (Pipeline Visualization) */}
        {task.workflow_nodes && task.workflow_nodes.length > 0 && (
          <div className="mb-6">
            <LiveStepView nodes={task.workflow_nodes} />
          </div>
        )}

        {/* Factory View for running tasks */}
        {['running', 'planning'].includes(task.status) && task.workflow_nodes && task.workflow_nodes.length > 0 && (
          <div className="mb-6">
            <FactoryView
              workflowNodes={task.workflow_nodes}
              pipelineName={task.title}
              estimatedCost={task.estimated_cost || 0}
              totalCost={task.actual_cost || 0}
              totalTokens={task.tokens_used || 0}
            />
          </div>
        )}

        {/* base44 ResultViewer/Rating 已移除 */}

        {/* Execution Log & Artifacts */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <ExecutionLog entries={task.execution_log || task.timeline || []} />
          <div className="space-y-6">
            <ArtifactList artifacts={task.artifacts || []} />
            {/* Cost Breakdown */}
            {task.workflow_nodes && task.workflow_nodes.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4">Cost Breakdown</h3>
                <div className="space-y-2">
                  {task.workflow_nodes.filter(n => n.cost > 0).map((node) => (
                    <div key={node.id} className="flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="text-white/50 truncate block">{node.agent}: {node.label}</span>
                        {node.model && <span className="text-[10px] text-white/25">{node.model}</span>}
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-white/70">${node.cost.toFixed(4)}</span>
                        {node.tokens > 0 && <span className="text-[10px] text-white/25 block">{node.tokens} tok</span>}
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-white/[0.06] pt-2 mt-2 flex items-center justify-between text-xs font-medium">
                    <span className="text-white/60">Total</span>
                    <span className="text-white">${(task.actual_cost || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}