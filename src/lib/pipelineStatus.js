// @ts-nocheck
/**
 * Single source of truth for task/step status colors, icons, and labels.
 * Shared by TaskCard, StepStream, and Run View (Phase 4+).
 */
import {
  CheckCircle2,
  Loader2,
  Clock,
  Pause,
  XCircle,
  Shield,
  SkipForward,
  Circle,
} from 'lucide-react';

/** Task-level status (TaskSummary / TaskCard). */
export const taskStatusConfig = {
  queued: { icon: Clock, color: 'text-white/40', bg: 'bg-white/5', label: 'Queued' },
  planning: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Planning', spin: true },
  running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Running', spin: true },
  paused: { icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Paused' },
  awaiting_approval: {
    icon: Shield,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    label: 'Awaiting Approval',
  },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'text-white/40', bg: 'bg-white/5', label: 'Cancelled' },
};

/** Step-level status (shared contract Step.status). */
export const stepStatusConfig = {
  pending: { icon: Circle, color: 'text-white/35', bg: 'bg-white/5', label: 'Pending' },
  running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Running', spin: true },
  passed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Passed' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
  skipped: { icon: SkipForward, color: 'text-white/40', bg: 'bg-white/5', label: 'Skipped' },
  awaiting_approval: {
    icon: Shield,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    label: 'Awaiting Approval',
  },
};

export function getTaskStatusConfig(status) {
  return taskStatusConfig[status] || taskStatusConfig.queued;
}

export function getStepStatusConfig(status) {
  return stepStatusConfig[status] || stepStatusConfig.pending;
}

/** @deprecated Use getTaskStatusConfig — kept for gradual migration */
export const statusConfig = taskStatusConfig;
