// @ts-nocheck
/** Single source for task/step status colors, icons, and labels (TaskCard, StepStream, Run View). */
import {
  CheckCircle2,
  Loader2,
  Clock,
  Pause,
  XCircle,
  Shield,
  SkipForward,
  AlertTriangle,
} from 'lucide-react';

/** Task-level statuses (dashboard cards, run header). */
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

/** Step-level statuses (contract: pending | running | passed | failed | skipped | awaiting_approval). */
export const stepStatusConfig = {
  pending: { icon: Clock, color: 'text-white/30', bg: 'bg-white/5', border: 'border-white/10', label: 'Pending' },
  running: {
    icon: Loader2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    label: 'Running',
    spin: true,
  },
  passed: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Passed',
  },
  failed: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Failed',
  },
  skipped: {
    icon: SkipForward,
    color: 'text-white/40',
    bg: 'bg-white/5',
    border: 'border-white/10',
    label: 'Skipped',
  },
  awaiting_approval: {
    icon: Shield,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Awaiting Approval',
  },
  // Legacy engine step aliases
  queued: { icon: Clock, color: 'text-white/30', bg: 'bg-white/5', border: 'border-white/10', label: 'Queued' },
  completed: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Completed',
  },
};

export function getTaskStatusConfig(status) {
  return taskStatusConfig[status] || taskStatusConfig.queued;
}

export function getStepStatusConfig(status) {
  return stepStatusConfig[status] || stepStatusConfig.pending;
}

/** @deprecated Use taskStatusConfig — kept for gradual migration */
export const statusConfig = taskStatusConfig;
