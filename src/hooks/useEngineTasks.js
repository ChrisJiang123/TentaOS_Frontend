// @ts-nocheck
import { useState, useEffect } from 'react';
import { engineTaskStore } from '@/lib/engineTaskStore';

export function useEngineTasks() {
  const [snap, setSnap] = useState(() => engineTaskStore.getSnapshot());
  useEffect(() => engineTaskStore.subscribe(setSnap), []);
  return {
    ...snap,
    tasks: Array.isArray(snap?.tasks) ? snap.tasks : [],
  };
}

export function useEngineTask(taskId) {
  const snap = useEngineTasks();
  const rec = taskId ? engineTaskStore.getTaskRecord(taskId) : null;
  return {
    task: snap.taskById[taskId] || null,
    record: rec,
    debug: rec
      ? {
          engineBaseUrl: snap.debug.engineBaseUrl,
          taskId,
          listApiUrl: snap.listDebug.listUrl,
          detailApiUrl: rec.detailUrl,
          httpStatus: rec.httpStatus,
          rawStatus: rec.raw?.status,
          stepsCount: rec.raw?.pipeline?.steps?.length ?? 0,
          outputExists: Boolean(rec.raw?.output),
          lastPollAt: rec.lastPollAt,
          pollError: rec.pollError,
        }
      : null,
    listDebug: snap.listDebug,
  };
}
