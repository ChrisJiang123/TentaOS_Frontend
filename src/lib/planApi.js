// @ts-nocheck
import engineClient from './engineClient.js';
import { derivePipeline } from './derivePipeline.js';
import { loadPreferencesForSubmit } from './preferencesApi.js';

/**
 * POST /api/plan — falls back to local heuristic plan when backend not ready.
 * @param {string} intent
 * @param {Record<string, unknown>} [preferences]
 */
export async function createPlan(intent, preferences) {
  const text = String(intent || '').trim();
  if (!text) throw new Error('Intent is empty');

  const prefs = preferences || (await loadPreferencesForSubmit());

  try {
    const res = await engineClient.createPlan({ intent: text, preferences: prefs });
    const planId = res?.plan_id ?? res?.planId ?? `plan-${Date.now()}`;
    const steps = Array.isArray(res?.steps) ? res.steps : [];
    if (!steps.length) {
      return buildFallbackPlan(text, planId);
    }
    return { plan_id: planId, steps };
  } catch (err) {
    const status = err?.httpStatus;
    if (status === 404 || status === 501 || status === 405 || isPlanNotReadyMessage(err)) {
      return buildFallbackPlan(text);
    }
    throw err;
  }
}

function isPlanNotReadyMessage(err) {
  const msg = String(err?.message || '').toLowerCase();
  return msg.includes('not found') || msg.includes('skipped') || msg.includes('plan');
}

/** Heuristic plan with risk + verification for offline / pre-P3 backend. */
export function buildFallbackPlan(intent, planId = `local-${Date.now()}`) {
  const steps = [
    {
      id: 'step-1',
      title: '分析需求与仓库上下文',
      tool: 'model',
      action: 'inspect repository',
      risk: 'low',
      status: 'pending',
      verification: { type: 'manual', expression: '需求范围已确认' },
    },
    {
      id: 'step-2',
      title: intent.slice(0, 120) || '执行主要变更',
      tool: 'terminal',
      action: 'apply changes',
      risk: 'medium',
      status: 'pending',
      verification: { type: 'test', expression: 'npm test' },
    },
    {
      id: 'step-3',
      title: '验证与收尾',
      tool: 'terminal',
      action: 'npm run lint && npm test',
      risk: 'high',
      status: 'pending',
      verification: { type: 'build', expression: 'npm run build' },
    },
  ];
  return { plan_id: planId, steps };
}

/**
 * @param {string} intent
 * @param {{ plan_id?: string, steps?: unknown[] }} plan
 */
export function planToPreviewPipeline(intent, plan) {
  return derivePipeline(
    {
      id: 'preview',
      intent,
      status: 'planning',
      steps: plan.steps || [],
      steps_completed: 0,
      steps_total: plan.steps?.length || 0,
    },
    { mode: 'preview', planId: plan.plan_id },
  );
}
