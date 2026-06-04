// @ts-nocheck
import engineClient from '@/lib/engineClient';
import { pipelineRunStore } from '@/lib/pipelineRunStore';
import { assertEngineConfigured } from '@/lib/runtimeConfig';
import { createRequestId } from '@/lib/runtimeDebug';
import { parseTaskIdFromSubmitResponse } from '@/lib/engineTaskUtils';
import { engineTaskStore } from '@/lib/engineTaskStore';
import { loadPreferencesForSubmit } from '@/lib/preferencesApi';

/**
 * Submit a task to Engine with full UI + debug observability.
 * Never silent-fails: throws after updating pipelineRunStore.
 */
export async function submitEngineTask(message, options = {}) {
  const { planId } = options;
  const preferences = options.preferences || (await loadPreferencesForSubmit());
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
    const res = await engineClient.submitTask(text, { requestId, planId, preferences });
    const serverRequestId = res?.request_id ?? res?.requestId ?? requestId;
    pipelineRunStore.markBackendReceived(res, serverRequestId);

    const taskId = parseTaskIdFromSubmitResponse(res);
    if (taskId) {
      await engineTaskStore.registerSubmittedTask(res);
    }

    return {
      res,
      requestId: serverRequestId,
      taskId,
      pipelineId: res?.pipeline_id ?? res?.pipelineId ?? null,
      sessionId: res?.session_id ?? res?.sessionId ?? null,
    };
  } catch (err) {
    pipelineRunStore.fail(err);
    throw err;
  }
}
