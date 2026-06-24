// @ts-nocheck
/**
 * Map GET /api/task/:id (or wrapped `{ task }`) → shared-contract Pipeline object.
 * `mode` is supplied by the caller (preview | live | replay).
 */
import {
  unwrapEngineTaskPayload,
  extractTaskId,
  buildResultByStepId,
  mapEngineStatus,
} from './engineTaskUtils.js';

function extractSteps(api) {
  if (!api || typeof api !== 'object') return [];
  if (Array.isArray(api.pipeline?.steps)) return api.pipeline.steps;
  if (Array.isArray(api.steps)) return api.steps;
  if (Array.isArray(api.workflow_nodes)) return api.workflow_nodes;
  if (api.result && Array.isArray(api.result.steps)) return api.result.steps;
  return [];
}

const DEFAULT_VERIFICATION = Object.freeze({
  type: 'manual',
  expression: '',
});

/**
 * @param {import('@/types/pipeline').PipelineMode} mode
 * @param {Record<string, unknown>|null|undefined} apiTask
 * @returns {import('@/types/pipeline').Pipeline}
 */
export function derivePipeline(apiTask, { mode = 'live' } = {}) {
  const raw = unwrapEngineTaskPayload(apiTask) || apiTask || {};
  const id = String(extractTaskId(raw) || extractTaskId(apiTask) || '');

  const intent = pickString(raw.intent, raw.goal, raw.prompt, raw.message, raw.input) || '';
  const title =
    pickString(raw.title) || (intent ? intent.slice(0, 80) : id ? `Task ${id}` : 'Task');

  const status = mapEngineStatus(raw.status);
  const created_date =
    pickString(raw.created_date, raw.created_at) || new Date().toISOString();

  const stepRecords = extractSteps(raw);
  const resultByStepId = buildResultByStepId(raw.results);
  const steps = stepRecords.map((record, index) => deriveStep(record, index, resultByStepId));

  const steps_total = numOr(
    raw.steps_total,
    raw.total_steps,
    raw.progress?.total,
    steps.length,
  );
  const steps_completed = numOr(
    raw.steps_completed,
    raw.completed_steps,
    raw.progress?.completed,
    countPassedSteps(steps),
  );

  const costRaw = raw.actual_cost ?? raw.total_cost ?? raw.cost;
  const actual_cost = costRaw != null && Number.isFinite(Number(costRaw)) ? Number(costRaw) : undefined;

  return {
    id,
    mode,
    title,
    intent,
    status,
    steps,
    steps_completed,
    steps_total: steps_total || steps.length,
    created_date,
    actual_cost,
    verification_summary: normalizeVerificationSummary(raw.verification_summary),
    forks: [],
  };
}

/**
 * @param {Record<string, unknown>} record
 * @param {number} index
 * @param {Map<string, object>} resultByStepId
 * @returns {import('@/types/pipeline').Step}
 */
function deriveStep(record, index, resultByStepId) {
  const stepId = String(record.step_id ?? record.id ?? index + 1);
  const result = resultByStepId.get(stepId) ?? resultByStepId.get(String(record.id));

  return {
    id: stepId,
    index,
    title: pickString(
      record.title,
      record.name,
      record.label,
      record.description,
      typeof record.task === 'string' ? record.task.slice(0, 80) : null,
    ) || `Step ${index + 1}`,
    tool: mapTool(record.tool, record.action_type, record.action),
    action: pickString(record.action, record.action_type, record.agent_role) || '',
    risk: mapRisk(record.risk, record.risk_level),
    status: mapStepStatus(record.status, result?.status),
    verification: normalizeVerification(record.verification, record),
    evidence: normalizeEvidence(record.evidence, result),
    checkpointId: pickString(record.checkpoint_id, record.checkpointId) || undefined,
  };
}

function pickString(...values) {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function numOr(...values) {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function mapTool(tool, actionType, action) {
  const raw = String(tool || actionType || action || '').toLowerCase();
  if (raw.includes('browser')) return 'browser';
  if (raw.includes('file')) return 'file';
  if (raw.includes('model') || raw.includes('llm')) return 'model';
  return 'terminal';
}

function mapRisk(risk, riskLevel) {
  const raw = String(risk ?? riskLevel ?? 'low').toLowerCase();
  if (raw === 'high' || raw === 'critical') return 'high';
  if (raw === 'medium' || raw === 'med') return 'medium';
  return 'low';
}

function mapStepStatus(rawStatus, resultStatus) {
  const s = String(rawStatus ?? resultStatus ?? '').toLowerCase();
  if (['passed', 'completed', 'success', 'done'].includes(s)) return 'passed';
  if (['failed', 'error'].includes(s)) return 'failed';
  if (['skipped', 'skip'].includes(s)) return 'skipped';
  if (['awaiting_approval', 'pending_approval', 'approval_required'].includes(s)) {
    return 'awaiting_approval';
  }
  if (['running', 'executing', 'in_progress', 'active'].includes(s)) return 'running';
  return 'pending';
}

function normalizeVerification(verification, record) {
  if (verification && typeof verification === 'object') {
    return {
      type: normalizeVerificationType(verification.type),
      expression: pickString(verification.expression, verification.criteria) || '',
      result: normalizeVerificationResult(verification.result),
      detail: pickString(verification.detail) || undefined,
    };
  }
  const expr = pickString(record.verification_expression, record.verification_criteria);
  if (expr) {
    return { type: 'manual', expression: expr };
  }
  return { ...DEFAULT_VERIFICATION };
}

function normalizeVerificationType(value) {
  const allowed = ['test', 'build', 'http', 'file_exists', 'diff_match', 'manual'];
  const v = String(value || 'manual').toLowerCase();
  return allowed.includes(v) ? v : 'manual';
}

function normalizeVerificationResult(value) {
  if (value === 'pass' || value === 'fail') return value;
  return undefined;
}

function normalizeEvidence(rawEvidence, result) {
  const items = [];
  if (Array.isArray(rawEvidence)) {
    for (const item of rawEvidence) {
      const ev = normalizeEvidenceItem(item);
      if (ev) items.push(ev);
    }
  }
  if (result && typeof result === 'object') {
    if (typeof result.output === 'string' && result.output) {
      items.push({ type: 'log', ref: result.output.slice(0, 500), label: 'output' });
    }
    if (result.screenshot_ref || result.screenshot) {
      items.push({
        type: 'screenshot',
        ref: String(result.screenshot_ref ?? result.screenshot),
      });
    }
  }
  return items;
}

function normalizeEvidenceItem(item) {
  if (!item || typeof item !== 'object') return null;
  const type = String(item.type || 'log').toLowerCase();
  const allowed = ['screenshot', 'terminal', 'diff', 'log'];
  const ref = pickString(item.ref, item.url, item.path, item.content);
  if (!ref) return null;
  return {
    type: allowed.includes(type) ? type : 'log',
    ref,
    label: pickString(item.label) || undefined,
  };
}

function normalizeVerificationSummary(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const checks = Array.isArray(raw.checks)
    ? raw.checks.map((c) => normalizeVerification(c, {}))
    : undefined;
  return {
    checks,
    final_diff_ref: pickString(raw.final_diff_ref) || undefined,
    duration_ms: numOr(raw.duration_ms) || undefined,
    cost: raw.cost != null && Number.isFinite(Number(raw.cost)) ? Number(raw.cost) : undefined,
  };
}

function countPassedSteps(steps) {
  return steps.filter((s) => s.status === 'passed').length;
}

export default derivePipeline;
