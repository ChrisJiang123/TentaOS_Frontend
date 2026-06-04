// @ts-nocheck
/**
 * Map GET /api/task/:id (or legacy /api/tasks/:id) payload → canonical Pipeline object.
 * @typedef {import('../types/pipeline').Pipeline} Pipeline
 * @typedef {import('../types/pipeline').Step} Step
 * @typedef {import('../types/pipeline').Fork} Fork
 * @typedef {import('../types/pipeline').PipelineMode} PipelineMode
 */
import {
  mapEngineStatus,
  unwrapEngineTaskPayload,
  extractTaskAnswer,
  extractTaskAnswerMeta,
} from './engineTaskUtils.js';

const RISK_LEVELS = new Set(['low', 'medium', 'high']);
const TOOLS = new Set(['terminal', 'browser', 'file', 'model']);
const VERIFICATION_TYPES = new Set([
  'test',
  'build',
  'http',
  'file_exists',
  'diff_match',
  'manual',
]);

function normalizeRisk(raw) {
  const r = String(raw ?? 'low').toLowerCase();
  return RISK_LEVELS.has(r) ? r : 'low';
}

function inferTool(step) {
  const t = String(step?.tool ?? step?.tool_type ?? '').toLowerCase();
  if (TOOLS.has(t)) return t;
  const role = String(step?.role ?? step?.agent ?? '').toLowerCase();
  if (role.includes('browser') || step?.screenshot_ref) return 'browser';
  if (role.includes('file') || step?.file_path) return 'file';
  if (role.includes('model') || step?.model_id) return 'model';
  return 'terminal';
}

function mapStepStatus(raw) {
  const s = String(raw ?? 'pending').toLowerCase().replace(/\s+/g, '_');
  if (['passed', 'pass', 'success', 'succeeded', 'completed', 'done'].includes(s)) return 'passed';
  if (['failed', 'fail', 'error'].includes(s)) return 'failed';
  if (['skipped', 'skip'].includes(s)) return 'skipped';
  if (['running', 'executing', 'in_progress', 'active'].includes(s)) return 'running';
  if (['awaiting_approval', 'pending_approval', 'approval_required', 'needs_approval'].includes(s)) {
    return 'awaiting_approval';
  }
  if (['queued', 'queue', 'pending', 'planned'].includes(s)) return 'pending';
  return 'pending';
}

function normalizeVerification(step) {
  const v = step?.verification;
  if (v && typeof v === 'object') {
    const type = VERIFICATION_TYPES.has(String(v.type).toLowerCase())
      ? String(v.type).toLowerCase()
      : 'manual';
    const resultRaw = v.result ?? v.status;
    let result;
    if (resultRaw === 'pass' || resultRaw === 'passed' || resultRaw === true) result = 'pass';
    else if (resultRaw === 'fail' || resultRaw === 'failed' || resultRaw === false) result = 'fail';
    return {
      type,
      expression: String(v.expression ?? v.criteria ?? v.check ?? step?.verification_expression ?? ''),
      ...(result ? { result } : {}),
      ...(v.detail ? { detail: String(v.detail) } : {}),
    };
  }
  const expression =
    step?.verification_expression ||
    step?.verification_criteria ||
    step?.check ||
    (step?.task && typeof step.task === 'string' ? `Verify: ${step.task}` : '');
  return {
    type: 'manual',
    expression: String(expression || 'Step completed successfully'),
  };
}

function normalizeEvidence(step) {
  const list = [];
  if (Array.isArray(step?.evidence)) {
    for (const e of step.evidence) {
      if (!e || typeof e !== 'object') continue;
      const type = ['screenshot', 'terminal', 'diff', 'log'].includes(String(e.type))
        ? e.type
        : 'log';
      if (e.ref) list.push({ type, ref: String(e.ref), ...(e.label ? { label: String(e.label) } : {}) });
    }
  }
  if (step?.screenshot_ref) {
    list.push({ type: 'screenshot', ref: String(step.screenshot_ref), label: 'Screenshot' });
  }
  if (step?.terminal_ref || step?.terminal_chunk) {
    list.push({
      type: 'terminal',
      ref: String(step.terminal_ref || step.terminal_chunk),
      label: 'Terminal',
    });
  }
  if (step?.diff_ref) {
    list.push({ type: 'diff', ref: String(step.diff_ref), label: 'Diff' });
  }
  return list;
}

function extractRawSteps(apiTask) {
  if (!apiTask || typeof apiTask !== 'object') return [];
  if (Array.isArray(apiTask.steps)) return apiTask.steps;
  if (Array.isArray(apiTask.pipeline?.steps)) return apiTask.pipeline.steps;
  if (Array.isArray(apiTask.workflow_nodes)) {
    return apiTask.workflow_nodes.map((n, i) => ({
      step_id: n.step_id || n.id || `step-${i}`,
      role: n.agent,
      task: n.label,
      status: n.status,
      risk: n.risk,
      tool: n.tool,
      verification: n.verification,
      evidence: n.evidence,
    }));
  }
  return [];
}

/**
 * @param {Record<string, unknown>|null|undefined} rawStep
 * @param {number} index
 * @returns {Step}
 */
export function deriveStep(rawStep, index) {
  const id = String(rawStep?.id ?? rawStep?.step_id ?? `step-${index}`);
  const title =
    rawStep?.title ||
    rawStep?.name ||
    rawStep?.label ||
    (typeof rawStep?.task === 'string' ? rawStep.task : null) ||
    `Step ${index + 1}`;
  return {
    id,
    index,
    title: String(title),
    tool: inferTool(rawStep),
    action: rawStep?.action ? String(rawStep.action) : undefined,
    risk: normalizeRisk(rawStep?.risk ?? rawStep?.risk_level),
    status: mapStepStatus(rawStep?.status),
    verification: normalizeVerification(rawStep),
    evidence: normalizeEvidence(rawStep),
    ...(rawStep?.checkpoint_id || rawStep?.checkpointId
      ? { checkpointId: String(rawStep.checkpoint_id ?? rawStep.checkpointId) }
      : {}),
  };
}

/**
 * @param {Record<string, unknown>|null|undefined} rawFork
 * @param {string} taskId
 * @returns {Fork}
 */
export function deriveFork(rawFork, taskId) {
  const id = String(rawFork?.id ?? rawFork?.fork_id ?? '');
  const steps = (Array.isArray(rawFork?.pipeline?.steps) ? rawFork.pipeline.steps : extractRawSteps(rawFork)).map(
    deriveStep,
  );
  return {
    id,
    task_id: String(rawFork?.task_id ?? taskId),
    strategy: String(rawFork?.strategy ?? 'default'),
    pipeline: {
      steps,
      status: mapEngineStatus(rawFork?.pipeline?.status ?? rawFork?.status ?? 'queued'),
    },
    ...(rawFork?.score != null ? { score: Number(rawFork.score) } : {}),
    ...(rawFork?.isWinner || rawFork?.is_winner ? { isWinner: true } : {}),
  };
}

/**
 * @param {Record<string, unknown>|null|undefined} apiTask - Full task JSON (may be wrapped in `{ task }`)
 * @param {{ mode?: PipelineMode, planId?: string }} [options]
 * @returns {Pipeline|null}
 */
export function derivePipeline(apiTask, options = {}) {
  const raw = unwrapEngineTaskPayload(apiTask) || apiTask;
  if (!raw || typeof raw !== 'object') return null;

  const taskId = String(raw.task_id ?? raw.taskId ?? raw.id ?? '');
  if (!taskId) return null;

  const intent = String(raw.intent ?? raw.goal ?? raw.message ?? raw.input ?? raw.prompt ?? '');
  const title =
    String(raw.title ?? '') ||
    (intent ? intent.slice(0, 80) : '') ||
    `Task ${taskId}`;

  const status = mapEngineStatus(raw.status);
  const stepRecords = extractRawSteps(raw);
  const steps = stepRecords.map((s, i) => deriveStep(s, i));

  const completedFromSteps = steps.filter((s) => s.status === 'passed').length;
  const steps_completed = Number(
    raw.steps_completed ??
      raw.completed_steps ??
      raw.progress?.completed ??
      completedFromSteps ??
      (status === 'completed' ? steps.length : 0),
  );
  const steps_total = Number(raw.steps_total ?? raw.total_steps ?? raw.progress?.total ?? steps.length) || 0;

  const forksRaw = Array.isArray(raw.forks) ? raw.forks : [];
  const forks = forksRaw.map((f) => deriveFork(f, taskId));

  const vs = raw.verification_summary;
  const verification_summary =
    vs && typeof vs === 'object'
      ? {
          ...(Array.isArray(vs.checks) ? { checks: vs.checks } : {}),
          ...(vs.final_diff_ref ? { final_diff_ref: String(vs.final_diff_ref) } : {}),
          ...(vs.duration_ms != null ? { duration_ms: Number(vs.duration_ms) } : {}),
          ...(vs.cost != null ? { cost: Number(vs.cost) } : {}),
        }
      : undefined;

  const answer = extractTaskAnswer(raw);
  const answerMeta = extractTaskAnswerMeta(raw);

  return {
    taskId,
    mode: options.mode || 'live',
    title,
    intent,
    status,
    steps,
    steps_completed,
    steps_total: steps_total || steps.length,
    verification_summary,
    forks,
    created_date: raw.created_at || raw.created_date || new Date().toISOString(),
    actual_cost: Number(raw.actual_cost ?? raw.total_cost ?? raw.cost ?? 0) || undefined,
    ...(answer ? { answer } : {}),
    ...answerMeta,
    ...(options.planId ? { plan_id: options.planId } : raw.plan_id ? { plan_id: String(raw.plan_id) } : {}),
  };
}
