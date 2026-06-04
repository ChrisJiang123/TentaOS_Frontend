// @ts-nocheck
import { useState, useEffect } from 'react';
import { pipelineRuntimeStore } from '@/lib/pipelineRuntimeStore';

export function usePipelineRuntime(taskId, mode = 'live') {
  const [snap, setSnap] = useState(() => pipelineRuntimeStore.getGlobalSnapshot());

  useEffect(() => pipelineRuntimeStore.subscribe(setSnap), []);

  useEffect(() => {
    if (!taskId) return undefined;
    pipelineRuntimeStore.mount(taskId, mode);
    return () => pipelineRuntimeStore.unmount(taskId);
  }, [taskId, mode]);

  const runtime = taskId ? snap.runtimes[taskId] : null;

  return {
    runtime,
    pipeline: runtime?.pipeline ?? null,
    pendingApprovalsCount: snap.pendingApprovalsCount,
    selectStep: (stepId) => pipelineRuntimeStore.selectStep(taskId, stepId),
    stopTask: () => pipelineRuntimeStore.stopTask(taskId),
    rollback: (checkpointId) => pipelineRuntimeStore.rollback(taskId, checkpointId),
    loadDiff: () => pipelineRuntimeStore.loadDiff(taskId),
    resolveApproval: (id, approved, feedback) =>
      pipelineRuntimeStore.resolveApproval(id, approved, feedback),
    screenshotUrl: (stepId) => pipelineRuntimeStore.screenshotUrl(taskId, stepId),
    startFork: (strategies) => pipelineRuntimeStore.startFork(taskId, strategies),
    mergeFork: (forkId) => pipelineRuntimeStore.mergeFork(taskId, forkId),
    timelineExtras: () => pipelineRuntimeStore.getTimelineExtras(taskId),
    forking: runtime?.forking,
    merging: runtime?.merging,
  };
}

export function usePendingApprovalsCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fn = (snap) => setCount(snap.pendingApprovalsCount);
    pipelineRuntimeStore.refreshPendingApprovals().catch(() => {});
    return pipelineRuntimeStore.subscribe(fn);
  }, []);
  return count;
}
