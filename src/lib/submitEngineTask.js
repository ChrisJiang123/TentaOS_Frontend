// @ts-nocheck
import engineClient from '@/lib/engineClient';
import { pipelineRunStore } from '@/lib/pipelineRunStore';
import { assertEngineConfigured } from '@/lib/runtimeConfig';
import { createRequestId } from '@/lib/runtimeDebug';

/**
 * Submit a task to Engine with full UI + debug observability.
 * Never silent-fails: throws after updating pipelineRunStore.
 */
export async function submitEngineTask(message, options = {}) {
  const text = String(message || '').trim();
  if (!text) {
    const err = new Error('Message is empty');
    pipelineRunStore.fail(err);
    throw err;
  }

  assertEngineConfigured();

  const requestId = options.requestId || createRequestId();
  pipelineRunStore.start(text, requestId);

  try {
    const res = await engineClient.submitTask(text, { requestId });
    pipelineRunStore.markBackendReceived(res, requestId);
    return { res, requestId, taskId: res?.task_id ?? res?.taskId ?? res?.id ?? null };
  } catch (err) {
    pipelineRunStore.fail(err);
    throw err;
  }
}
