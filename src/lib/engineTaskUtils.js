// @ts-nocheck
/** Map Engine API / WS status strings to TaskCard / LivePipelineCard statuses */

export function mapEngineStatus(raw) {
  const s = String(raw ?? '').toLowerCase().replace(/\s+/g, '_');
  if (['completed', 'success', 'done', 'succeeded'].includes(s)) return 'completed';
  if (['failed', 'error'].includes(s)) return 'failed';
  if (['cancelled', 'canceled', 'stopped', 'aborted'].includes(s)) return 'cancelled';
  if (['awaiting_approval', 'pending_approval', 'approval_required', 'needs_approval'].includes(s)) {
    return 'awaiting_approval';
  }
  if (['paused', 'pause'].includes(s)) return 'paused';
  if (['running', 'executing', 'in_progress', 'active'].includes(s)) return 'running';
  if (['planning', 'thinking'].includes(s)) return 'planning';
  if (['queued', 'pending', 'queue'].includes(s)) return 'queued';
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

function extractSteps(api) {
  if (!api || typeof api !== 'object') return [];
  if (Array.isArray(api.steps)) return api.steps;
  if (Array.isArray(api.workflow_nodes)) return api.workflow_nodes;
  if (api.result && Array.isArray(api.result.steps)) return api.result.steps;
  return [];
}

export function stepsToWorkflowNodes(steps) {
  return steps.map((s, i) => ({
    id: s.id || s.step_id || `step-${i}`,
    agent: s.agent || s.role || 'Agent',
    label:
      s.label ||
      s.name ||
      s.title ||
      (typeof s.task === 'string' ? s.task.slice(0, 48) : null) ||
      s.description ||
      `Step ${i + 1}`,
    status: mapStepStatus(s.status),
  }));
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

/**
 * @param {Record<string, unknown>|null|undefined} api - GET /api/task/:id JSON
 * @param {{ goal?: string, created_date?: string, pipeline?: { steps?: unknown[] }, taskId?: string }} meta
 */
export function normalizeEngineTask(api, meta = {}) {
  const id = api?.task_id || api?.id || meta.taskId;
  if (!id) return null;

  const status = mapEngineStatus(api?.status);
  const goal = meta.goal || api?.message || api?.input || api?.prompt || '';
  const title = (goal && goal.slice(0, 80)) || `任务 ${id}`;

  const fromApi = stepsToWorkflowNodes(extractSteps(api));
  const fromPipeline =
    meta.pipeline?.steps?.map((s, i) => ({
      id: s.step_id || `p-${i}`,
      agent: s.role || 'Agent',
      label:
        (typeof s.task === 'string' ? s.task.slice(0, 48) : null) || `Step ${i + 1}`,
      status: 'queued',
    })) || [];

  let workflow_nodes = fromApi.length ? fromApi : fromPipeline;

  const steps_completed = Number(api?.steps_completed ?? api?.progress?.completed ?? 0);
  const steps_total = Number(
    (api?.steps_total ?? api?.progress?.total ?? workflow_nodes.length) || 0,
  );

  workflow_nodes = applyProgressToNodes(
    workflow_nodes,
    steps_completed,
    steps_total || workflow_nodes.length,
    status,
  );

  return {
    id,
    title,
    goal,
    status,
    steps_completed,
    steps_total: steps_total || workflow_nodes.length,
    actual_cost: Number(api?.actual_cost ?? api?.cost ?? api?.total_cost ?? 0),
    tokens_used: Number(api?.tokens_used ?? api?.tokens ?? api?.token_count ?? 0),
    workflow_nodes,
    created_date: meta.created_date || api?.created_at || api?.created_date || new Date().toISOString(),
    pack: 'custom',
    execution_log: api?.execution_log,
    timeline: api?.timeline,
    source: 'engine',
  };
}

export function parseTaskIdFromSubmitResponse(res) {
  return res?.task_id ?? res?.taskId ?? res?.id ?? null;
}
