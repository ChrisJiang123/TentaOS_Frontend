// @ts-nocheck
/**
 * Phase 1 control-plane Engine APIs with safe fallbacks (no white-screen on missing endpoints).
 */
import engineClient, { NO_CACHE_FETCH } from '@/lib/engineClient';
import { ENGINE_PATHS } from '@/lib/engineApiPaths';
import {
  STATIC_AGENT_REGISTRY,
  STATIC_MODEL_REGISTRY,
  STATIC_CORTEX_INFO,
  STATIC_PRICING_INFO,
} from '@/data/controlPlaneFallbacks';

function errMsg(e) {
  return e instanceof Error ? e.message : String(e);
}

function unwrapObject(raw) {
  if (!raw || typeof raw !== 'object') return {};
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) return raw.data;
  return raw;
}

function unwrapList(raw, keys = []) {
  if (Array.isArray(raw)) return raw;
  const o = unwrapObject(raw);
  for (const k of keys) {
    if (Array.isArray(o[k])) return o[k];
  }
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.data)) return o.data;
  return [];
}

function bust(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}t=${Date.now()}`;
}

async function safeGet(path, listKeys = []) {
  try {
    const raw = await engineClient.request(bust(path), { ...NO_CACHE_FETCH });
    return { ok: true, data: unwrapObject(raw), list: unwrapList(raw, listKeys), source: 'engine', error: null };
  } catch (e) {
    return { ok: false, data: {}, list: [], source: 'unavailable', error: errMsg(e) };
  }
}

async function safeWrite(path, { method = 'POST', body } = {}) {
  try {
    const raw = await engineClient.request(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { ok: true, data: unwrapObject(raw), source: 'engine', error: null };
  } catch (e) {
    return { ok: false, data: null, source: 'unavailable', error: errMsg(e) };
  }
}

export async function fetchAgents() {
  const res = await safeGet('/api/agents', ['agents']);
  if (res.ok && res.list.length) {
    return { ...res, items: res.list.map(normalizeAgent).filter((a) => a && a.id) };
  }
  if (res.ok && !res.list.length) {
    return { ...res, items: [], empty: true };
  }
  return {
    ok: false,
    source: 'static_registry',
    items: STATIC_AGENT_REGISTRY.map(normalizeAgent),
    error: res.error,
    fallback: true,
  };
}

export async function fetchModels() {
  const res = await safeGet('/api/models', ['models']);
  if (res.ok && res.list.length) {
    return { ...res, items: res.list.map(normalizeModel).filter((m) => m && m.id) };
  }
  if (res.ok && !res.list.length) {
    return { ...res, items: [], empty: true };
  }
  return {
    ok: false,
    source: 'static_registry',
    items: STATIC_MODEL_REGISTRY.map(normalizeModel),
    error: res.error,
    fallback: true,
  };
}

export async function fetchTriggers() {
  const res = await safeGet('/api/triggers', ['triggers']);
  if (res.ok) {
    return { ...res, items: res.list.map(normalizeTrigger).filter((t) => t && t.id) };
  }
  return { ok: false, source: 'unavailable', items: [], error: res.error };
}

export async function createTrigger(payload) {
  return safeWrite('/api/triggers', { method: 'POST', body: payload });
}

export async function updateTrigger(id, payload) {
  return safeWrite(`/api/triggers/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload });
}

export async function deleteTrigger(id) {
  return safeWrite(`/api/triggers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchPricing() {
  const res = await safeGet('/api/pricing', ['plans', 'products']);
  if (res.ok && (res.list.length || Object.keys(res.data).length)) {
    const plansRaw = res.list.length ? res.list : res.data.plans;
    const plans = Array.isArray(plansRaw) ? plansRaw : [];
    return { ...res, pricing: res.data, plans };
  }
  return {
    ok: false,
    source: 'static',
    pricing: STATIC_PRICING_INFO,
    plans: [],
    error: res.error,
    fallback: true,
  };
}

export async function fetchControlPlaneStatus() {
  const res = await safeGet('/api/control-plane/status', ['services', 'components']);
  if (res.ok) {
    return { ...res, status: res.data };
  }
  return { ok: false, source: 'unavailable', status: null, error: res.error };
}

export async function fetchCortexInfo() {
  const res = await safeGet('/api/cortex', ['layers', 'protocol']);
  if (res.ok && Object.keys(res.data).length) {
    return { ...res, cortex: res.data };
  }
  return {
    ok: false,
    source: 'static',
    cortex: STATIC_CORTEX_INFO,
    error: res.error,
    fallback: true,
  };
}

export async function probeTaskApi() {
  try {
    const meta = await engineClient.fetchTasksList();
    return {
      ok: meta.ok,
      httpStatus: meta.httpStatus,
      count: unwrapList(meta.payload, ['tasks']).length,
      error: meta.error,
    };
  } catch (e) {
    return { ok: false, httpStatus: e?.httpStatus ?? 0, count: 0, error: errMsg(e) };
  }
}

export async function probeHealth() {
  try {
    const data = await engineClient.getHealth();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

function normalizeAgent(a) {
  if (!a || typeof a !== 'object') return {};
  return {
    id: String(a.id ?? a.agent_id ?? a.name ?? 'agent'),
    name: a.name ?? a.display_name ?? 'Agent',
    role: a.role ?? a.description ?? a.agent_role ?? '—',
    status: a.status ?? (a.is_active === false ? 'inactive' : 'active'),
    strengths: arr(a.strengths ?? a.capabilities),
    tools: arr(a.tools),
    model_preference: a.model_preference ?? a.model_id ?? a.preferred_model ?? '—',
  };
}

function normalizeModel(m) {
  if (!m || typeof m !== 'object') return {};
  return {
    id: String(m.id ?? m.model_id ?? m.name ?? 'model'),
    name: m.name ?? m.display_name ?? m.model_id ?? 'Model',
    provider: m.provider ?? '—',
    deployment: m.deployment ?? m.tier ?? m.local_cloud ?? m.candidate ?? '—',
    strengths: arr(m.strengths),
    best_for: arr(m.best_for ?? m.use_cases),
    speed_tier: m.speed_tier ?? m.speed ?? '—',
    cost_tier: m.cost_tier ?? m.cost ?? '—',
    context_tier: m.context_tier ?? m.context ?? '—',
    routing_notes: m.routing_notes ?? m.notes ?? m.routing ?? '—',
    is_active: m.is_active !== false,
  };
}

function normalizeTrigger(t) {
  if (!t || typeof t !== 'object') return {};
  const type = t.trigger_type ?? t.type ?? 'manual';
  return {
    id: String(t.id ?? t.trigger_id ?? `trg_${Date.now()}`),
    name: t.name ?? 'Trigger',
    trigger_type: type,
    is_active: t.is_active !== false,
    schedule: t.schedule ?? t.cron ?? null,
    webhook_url: t.webhook_url ?? t.url ?? null,
    condition: t.condition ?? t.config ?? null,
    trigger_count: num(t.trigger_count, 0),
    last_triggered: t.last_triggered ?? t.last_fired_at ?? null,
    task_template: t.task_template ?? null,
  };
}

function arr(v) {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string' && v) return [v];
  return [];
}

function num(v, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

export { ENGINE_PATHS };
