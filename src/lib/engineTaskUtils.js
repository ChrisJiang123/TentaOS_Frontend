// @ts-nocheck
/** Map Engine API / WS status strings to TaskCard / LivePipelineCard statuses */

export function mapEngineStatus(raw) {
  const s = String(raw ?? '').toLowerCase().replace(/\s+/g, '_');
  if (['completed', 'success', 'done', 'succeeded', 'finished'].includes(s)) return 'completed';
  if (['failed', 'error'].includes(s)) return 'failed';
  if (['cancelled', 'canceled', 'stopped', 'aborted'].includes(s)) return 'cancelled';
  if (['awaiting_approval', 'pending_approval', 'approval_required', 'needs_approval'].includes(s)) {
    return 'awaiting_approval';
  }
  if (['paused', 'pause'].includes(s)) return 'paused';
  if (['running', 'executing', 'in_progress', 'active'].includes(s)) return 'running';
  if (['planning', 'thinking'].includes(s)) return 'planning';
  if (['queued', 'pending', 'queue', 'submitted', 'received', 'created', 'accepted'].includes(s)) {
    return 'queued';
  }
  return 'queued';
}

export function mapStepStatus(raw) {
  const s = String(raw ?? '').toLowerCase();
  if (['completed', 'success', 'done'].includes(s)) return 'completed';
  if (['running', 'executing', 'in_progress', 'active'].includes(s)) return 'running';
  if (['failed', 'error'].includes(s)) return 'failed';
  return 'queued';
}

export function isActiveEngineStatus(status) {
  return ['running', 'planning', 'queued', 'awaiting_approval', 'paused'].includes(status);
}

export function isTerminalEngineStatus(status) {
  return ['completed', 'failed', 'cancelled'].includes(status);
}

/** Unwrap `{ ok, task }` or nested submit payloads into the task record. */
export function unwrapEngineTaskPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.task && typeof payload.task === 'object') return payload.task;
  if (payload.task_id || payload.id) return payload;
  if (payload.ok === false) return null;
  return payload;
}

/** Extract task array from GET /api/tasks list response. */
export function extractTaskList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.tasks)) return payload.tasks;
  if (Array.isArray(payload.data?.tasks)) return payload.data.tasks;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export function extractTaskId(record) {
  if (!record || typeof record !== 'object') return null;
  return (
    record.task_id ??
    record.taskId ??
    record.id ??
    record.task?.task_id ??
    record.task?.taskId ??
    record.task?.id ??
    null
  );
}

function extractSteps(api) {
  if (!api || typeof api !== 'object') return [];
  if (Array.isArray(api.pipeline?.steps)) return api.pipeline.steps;
  if (Array.isArray(api.steps)) return api.steps;
  if (Array.isArray(api.workflow_nodes)) return api.workflow_nodes;
  if (api.result && Array.isArray(api.result.steps)) return api.result.steps;
  return [];
}

/** Map step_id -> result row (duration_ms often lives in results, not steps). */
export function buildResultByStepId(results) {
  const list = Array.isArray(results) ? results : [];
  const map = new Map();
  for (const r of list) {
    if (!r || typeof r !== 'object') continue;
    const key = r.step_id ?? r.stepId ?? r.id;
    if (key != null) map.set(String(key), r);
  }
  return map;
}

export function stepsToWorkflowNodes(steps, resultByStepId = new Map()) {
  return steps.map((s, i) => {
    const stepId = String(s.step_id ?? s.id ?? `step-${i}`);
    const result = resultByStepId.get(stepId) ?? resultByStepId.get(String(s.id));
    const durationRaw = s.duration_ms ?? result?.duration_ms;
    const costRaw = s.cost ?? s.cost_usd ?? result?.cost ?? result?.cost_usd;
    const tokensRaw = s.tokens ?? s.tokens_used ?? result?.tokens ?? result?.tokens_used;
    const duration_ms = Number(durationRaw);
    const cost = Number(costRaw);
    const tokens = Number(tokensRaw);

    return {
      id: s.id || s.step_id || `step-${i}`,
      step_id: stepId,
      agent: s.agent || s.role || 'Agent',
      label:
        s.label ||
        s.name ||
        s.title ||
        (typeof s.task === 'string' ? s.task.slice(0, 48) : null) ||
        s.description ||
        `Step ${i + 1}`,
      status: mapStepStatus(s.status),
      duration_ms: Number.isFinite(duration_ms) ? duration_ms : undefined,
      cost: Number.isFinite(cost) ? cost : undefined,
      tokens: Number.isFinite(tokens) ? tokens : undefined,
      error_message: s.error ?? s.error_message ?? result?.error,
    };
  });
}

function applyProgressToNodes(nodes, stepsCompleted, stepsTotal, taskStatus) {
  if (!nodes.length || stepsCompleted == null) return nodes;
  const total = stepsTotal || nodes.length;
  const done = Math.min(Math.max(0, stepsCompleted), total);
  return nodes.map((n, i) => {
    if (n.status === 'failed') return n;
    if (i < done) return { ...n, status: 'completed' };
    if (i === done && ['running', 'planning', 'queued'].includes(taskStatus)) {
      return { ...n, status: 'running' };
    }
    return { ...n, status: 'queued' };
  });
}

function countCompletedSteps(steps) {
  if (!Array.isArray(steps) || !steps.length) return null;
  return steps.filter((s) => mapStepStatus(s.status) === 'completed').length;
}

/**
 * @param {Record<string, unknown>|null|undefined} api - GET /api/tasks/:id JSON (may wrap `task`)
 * @param {{ goal?: string, created_date?: string, pipeline?: { steps?: unknown[] }, taskId?: string }} meta
 */
export function normalizeEngineTask(api, meta = {}) {
  const raw = unwrapEngineTaskPayload(api) || api;
  const id = extractTaskId(raw) || extractTaskId(api) || meta.taskId;
  if (!id) return null;

  const status = mapEngineStatus(raw?.status);
  const goal =
    meta.goal ||
    raw?.message ||
    raw?.input ||
    raw?.prompt ||
    raw?.goal ||
    '';
  const title = (goal && goal.slice(0, 80)) || `任务 ${id}`;

  const stepRecords = extractSteps(raw);
  const resultByStepId = buildResultByStepId(raw?.results);
  const fromApi = stepsToWorkflowNodes(stepRecords, resultByStepId);
  const fromPipeline =
    meta.pipeline?.steps?.map((s, i) => ({
      id: s.step_id || `p-${i}`,
      agent: s.role || 'Agent',
      label:
        (typeof s.task === 'string' ? s.task.slice(0, 48) : null) || `Step ${i + 1}`,
      status: 'queued',
    })) || [];

  let workflow_nodes = fromApi.length ? fromApi : fromPipeline;

  const completedFromSteps = countCompletedSteps(stepRecords);
  const steps_completed = Number(
    raw?.completed_steps ??
      raw?.steps_completed ??
      raw?.progress?.completed ??
      completedFromSteps ??
      (status === 'completed' ? workflow_nodes.length : 0),
  );
  const steps_total = Number(
    (raw?.total_steps ??
      raw?.steps_total ??
      raw?.progress?.total ??
      workflow_nodes.length) || 0,
  );

  workflow_nodes = applyProgressToNodes(
    workflow_nodes,
    steps_completed,
    steps_total || workflow_nodes.length,
    status,
  );

  if (status === 'completed' && workflow_nodes.length) {
    workflow_nodes = workflow_nodes.map((n) =>
      n.status === 'failed' ? n : { ...n, status: 'completed' },
    );
  }

  return {
    id,
    title,
    goal,
    status,
    steps_completed,
    steps_total: steps_total || workflow_nodes.length,
    actual_cost: Number(raw?.total_cost ?? raw?.actual_cost ?? raw?.cost ?? 0) || 0,
    tokens_used: Number(raw?.tokens_used ?? raw?.tokens ?? raw?.token_count ?? 0),
    workflow_nodes,
    created_date: meta.created_date || raw?.created_at || raw?.created_date || new Date().toISOString(),
    started_at: raw?.started_at || raw?.created_at,
    completed_at: raw?.completed_at || raw?.finished_at,
    pack: 'custom',
    execution_log: raw?.execution_log || raw?.results,
    timeline: raw?.timeline,
    output: raw?.output,
    results: raw?.results,
    pipeline_id: raw?.pipeline_id ?? raw?.pipelineId,
    source: 'engine',
    _rawStatus: raw?.status,
  };
}

export function parseTaskIdFromSubmitResponse(res) {
  return extractTaskId(res);
}

export function parseSubmitResponse(res) {
  if (!res || typeof res !== 'object') {
    return { taskId: null, requestId: null, pipelineId: null, sessionId: null, success: false };
  }
  return {
    taskId: extractTaskId(res),
    requestId: res.request_id ?? res.requestId ?? null,
    pipelineId: res.pipeline_id ?? res.pipelineId ?? null,
    sessionId: res.session_id ?? res.sessionId ?? null,
    success: res.success !== false && res.ok !== false,
    status: res.status ?? res.task?.status ?? null,
  };
}
