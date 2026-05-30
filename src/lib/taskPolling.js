// @ts-nocheck
import { engineTaskStore, POLL_INTERVAL_MS } from '@/lib/engineTaskStore';
import { pipelineRunStore } from '@/lib/pipelineRunStore';
import { unwrapEngineTaskPayload } from '@/lib/engineTaskUtils';

/** Sync pipeline run chip from HTTP-polled task record (source of truth). */
export function syncPipelineFromTask(task) {
  if (!task) return;
  pipelineRunStore.syncFromTask(task);
}

/** @deprecated Use engineTaskStore.registerSubmittedTask */
export function startTaskPoll(taskId) {
  engineTaskStore.startPoll(taskId);
}

export function getTaskPollIntervalMs() {
  return POLL_INTERVAL_MS;
}

export async function refreshEngineTasks() {
  return engineTaskStore.refreshList();
}

export { engineTaskStore };
