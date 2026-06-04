import engineClient from './engineClient';
import type {
  ApiResult,
  CortexPipelineNode,
  CortexPipelineWorkflow,
  DashboardCostPayload,
  DashboardCortexPayload,
  DashboardOverviewPayload,
  DashboardTentaclesPayload,
  DashboardTracesPayload,
  DashboardTraceItem,
  DryRunPipelineRequestPayload,
  DryRunPipelineResponsePayload,
  ProofBundlePayload,
  PipelineNodesPayload,
  PipelineTemplatesPayload,
  ValidatePipelineRequestPayload,
  ValidatePipelineResponsePayload,
} from '../../shared/contracts/dashboardPipelineContracts';
import {
  cortexPipelineWorkflowsMock,
  dashboardMock,
  pipelineCatalogNodesMock,
  pipelineMockDryRun,
  pipelineMockValidation,
  proofBundleMockForCapsule,
} from '@/data/tentaosDashboardMock';

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Prefer nested shapes returned by some backends */
function pickNested(raw: Record<string, unknown>, key: string): Record<string, unknown> {
  const inner = raw[key];
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) return inner as Record<string, unknown>;
  return {};
}

function unwrapBody(raw: unknown): Record<string, unknown> {
  const r = asRecord(raw);
  if (r.data !== undefined && typeof r.data === 'object' && r.data !== null && !Array.isArray(r.data)) {
    return r.data as Record<string, unknown>;
  }
  return r;
}

// --- Dashboard mocks (slices of dashboardMock) --------------------------------

function mockOverview(): DashboardOverviewPayload {
  return {
    token_saved_pct: dashboardMock.token_saved_pct,
    cost_saved_pct: dashboardMock.cost_saved_pct,
    active_tasks: dashboardMock.active_tasks,
    unsafe_actions_blocked: dashboardMock.unsafe_actions_blocked,
    avg_reflex_latency_ms: dashboardMock.avg_reflex_latency_ms,
  };
}

function mockCortex(): DashboardCortexPayload {
  return { ...dashboardMock.cortex_state };
}

function mockTentacles(): DashboardTentaclesPayload {
  return { ...dashboardMock.tentacle_runtime };
}

function mockTraces(): DashboardTracesPayload {
  return { traces: [...dashboardMock.recent_traces] };
}

function mockCost(): DashboardCostPayload {
  return { series: [...dashboardMock.cost_series_7d] };
}

// --- Normalizers --------------------------------------------------------------

function normalizeOverview(raw: unknown): DashboardOverviewPayload {
  const r = unwrapBody(raw);
  const nested = pickNested(r, 'overview');
  const src = Object.keys(nested).length ? nested : r;
  return {
    token_saved_pct: num(src.token_saved_pct, mockOverview().token_saved_pct),
    cost_saved_pct: num(src.cost_saved_pct, mockOverview().cost_saved_pct),
    active_tasks: num(src.active_tasks, mockOverview().active_tasks),
    unsafe_actions_blocked: num(src.unsafe_actions_blocked, mockOverview().unsafe_actions_blocked),
    avg_reflex_latency_ms: num(src.avg_reflex_latency_ms, mockOverview().avg_reflex_latency_ms),
  };
}

function normalizeCortex(raw: unknown): DashboardCortexPayload {
  const r = unwrapBody(raw);
  const nested = pickNested(r, 'cortex_state');
  const src = Object.keys(nested).length ? nested : pickNested(r, 'cortex');
  const base = Object.keys(src).length ? src : r;
  const m = mockCortex();
  return {
    version: String(base.version ?? m.version),
    status: String(base.status ?? m.status),
    risk: String(base.risk ?? m.risk),
  };
}

function normalizeTentacles(raw: unknown): DashboardTentaclesPayload {
  const r = unwrapBody(raw);
  const nested = pickNested(r, 'tentacle_runtime');
  const src = Object.keys(nested).length ? nested : pickNested(r, 'tentacles');
  const base = Object.keys(src).length ? src : r;
  const m = mockTentacles();
  const hb = base.last_heartbeat_ms_ago;
  const hbNum = hb === null || hb === undefined ? m.last_heartbeat_ms_ago : num(hb, m.last_heartbeat_ms_ago ?? 0);
  return {
    ws_clients: num(base.ws_clients, m.ws_clients),
    pending_approvals: num(base.pending_approvals, m.pending_approvals),
    last_heartbeat_ms_ago: hb === null ? null : hbNum,
  };
}

function normalizeTraceItem(t: unknown, i: number): DashboardTraceItem | null {
  const o = asRecord(t);
  if (!o.id && !o.label) return null;
  return {
    id: String(o.id ?? `tr_${i}`),
    ts: num(o.ts, Date.now()),
    label: String(o.label ?? ''),
    severity: (['info', 'success', 'warning', 'critical'].includes(String(o.severity))
      ? o.severity
      : 'info') as DashboardTraceItem['severity'],
  };
}

function normalizeTraces(raw: unknown): DashboardTracesPayload {
  const r = unwrapBody(raw);
  let list: unknown[] = [];
  if (Array.isArray(r.traces)) list = r.traces;
  else if (Array.isArray(r.recent_traces)) list = r.recent_traces;
  else if (Array.isArray(r.items)) list = r.items;
  const traces = list.map(normalizeTraceItem).filter(Boolean) as DashboardTraceItem[];
  return { traces };
}

function normalizeCost(raw: unknown): DashboardCostPayload {
  const r = unwrapBody(raw);
  let series: unknown[] = [];
  if (Array.isArray(r.series)) series = r.series;
  else if (Array.isArray(r.cost_series_7d)) series = r.cost_series_7d;
  const mapped = series
    .map((d) => {
      const o = asRecord(d);
      return {
        day: String(o.day ?? ''),
        saved: num(o.saved, 0),
        spent: num(o.spent, 0),
      };
    })
    .filter((d) => d.day);
  return { series: mapped };
}

function normalizeTemplates(raw: unknown): CortexPipelineWorkflow[] {
  const r = unwrapBody(raw);
  if (Array.isArray(r.templates)) return r.templates as CortexPipelineWorkflow[];
  if (Array.isArray(r.workflows)) return r.workflows as CortexPipelineWorkflow[];
  if (Array.isArray(raw)) return raw as CortexPipelineWorkflow[];
  return [];
}

function normalizePipelineNodes(raw: unknown): CortexPipelineNode[] {
  const r = unwrapBody(raw);
  if (Array.isArray(r.nodes)) return r.nodes as CortexPipelineNode[];
  if (Array.isArray(raw)) return raw as CortexPipelineNode[];
  return [];
}

function normalizeProofBundle(raw: unknown, capsuleId: string): ProofBundlePayload {
  const r = unwrapBody(raw);
  const artifacts = Array.isArray(r.artifacts) ? (r.artifacts as ProofBundlePayload['artifacts']) : [];
  return {
    capsule_id: String(r.capsule_id ?? capsuleId),
    created_at: r.created_at != null ? String(r.created_at) : undefined,
    engine_version: r.engine_version != null ? String(r.engine_version) : undefined,
    artifacts,
    summary: r.summary != null ? String(r.summary) : undefined,
  };
}

function normalizeValidation(raw: unknown): ValidatePipelineResponsePayload {
  const r = unwrapBody(raw);
  return {
    ok: Boolean(r.ok),
    summary: r.summary != null ? String(r.summary) : undefined,
    warnings: Array.isArray(r.warnings) ? (r.warnings as string[]).map(String) : [],
    errors: Array.isArray(r.errors) ? (r.errors as string[]).map(String) : [],
  };
}

function normalizeDryRun(raw: unknown): DryRunPipelineResponsePayload {
  const r = unwrapBody(raw);
  const plan = Array.isArray(r.plan)
    ? (r.plan as unknown[]).map((p) => {
        const o = asRecord(p);
        return { step: String(o.step ?? ''), status: String(o.status ?? '') };
      })
    : [];
  return {
    proof_mode: Boolean(r.proof_mode),
    rollback_available: Boolean(r.rollback_available),
    trace_recording: Boolean(r.trace_recording),
    estimated_cost_usd: num(r.estimated_cost_usd, 0),
    estimated_tokens: num(r.estimated_tokens, 0),
    plan,
  };
}

async function withEngine<T>(fetcher: () => Promise<unknown>, normalize: (raw: unknown) => T, mock: T): Promise<ApiResult<T>> {
  try {
    const raw = await fetcher();
    const data = normalize(raw);
    return { data, source: 'engine', error: null };
  } catch (e) {
    return { data: mock, source: 'mock', error: errMsg(e) };
  }
}

// --- Public API ---------------------------------------------------------------

export async function getDashboardOverview(): Promise<ApiResult<DashboardOverviewPayload>> {
  return withEngine(() => engineClient.request('/api/dashboard/overview'), normalizeOverview, mockOverview());
}

export async function getDashboardCortex(): Promise<ApiResult<DashboardCortexPayload>> {
  return withEngine(() => engineClient.request('/api/dashboard/cortex'), normalizeCortex, mockCortex());
}

export async function getDashboardTentacles(): Promise<ApiResult<DashboardTentaclesPayload>> {
  return withEngine(() => engineClient.request('/api/dashboard/tentacles'), normalizeTentacles, mockTentacles());
}

export async function getDashboardTraces(): Promise<ApiResult<DashboardTracesPayload>> {
  return withEngine(() => engineClient.request('/api/dashboard/traces'), normalizeTraces, mockTraces());
}

export async function getDashboardCost(): Promise<ApiResult<DashboardCostPayload>> {
  return withEngine(() => engineClient.request('/api/dashboard/cost'), normalizeCost, mockCost());
}

export async function getProofBundle(capsuleId: string): Promise<ApiResult<ProofBundlePayload>> {
  const id = encodeURIComponent(capsuleId);
  const mock = proofBundleMockForCapsule(capsuleId);
  return withEngine(
    () => engineClient.request(`/api/proof-bundle/${id}`),
    (raw) => normalizeProofBundle(raw, capsuleId),
    mock,
  );
}

export async function getPipelineNodes(): Promise<ApiResult<PipelineNodesPayload>> {
  return withEngine(
    () => engineClient.request('/api/pipeline/nodes'),
    (raw) => ({ nodes: normalizePipelineNodes(raw) }),
    { nodes: [...pipelineCatalogNodesMock] },
  );
}

export async function getPipelineTemplates(): Promise<ApiResult<PipelineTemplatesPayload>> {
  return withEngine(
    () => engineClient.request('/api/pipeline/templates'),
    (raw) => ({ templates: normalizeTemplates(raw) }),
    { templates: [...cortexPipelineWorkflowsMock] },
  );
}

export async function validatePipeline(payload: ValidatePipelineRequestPayload): Promise<ApiResult<ValidatePipelineResponsePayload>> {
  return withEngine(
    () =>
      engineClient.request('/api/pipeline/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    normalizeValidation,
    { ...pipelineMockValidation },
  );
}

export async function dryRunPipeline(payload: DryRunPipelineRequestPayload): Promise<ApiResult<DryRunPipelineResponsePayload>> {
  return withEngine(
    () =>
      engineClient.request('/api/pipeline/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    normalizeDryRun,
    { ...pipelineMockDryRun },
  );
}

/** Parallel dashboard fetches with per-section results (convenience for React Query). */
export async function getDashboardPanelBundle(): Promise<{
  overview: ApiResult<DashboardOverviewPayload>;
  cortex: ApiResult<DashboardCortexPayload>;
  tentacles: ApiResult<DashboardTentaclesPayload>;
  traces: ApiResult<DashboardTracesPayload>;
  cost: ApiResult<DashboardCostPayload>;
}> {
  const [overview, cortex, tentacles, traces, cost] = await Promise.all([
    getDashboardOverview(),
    getDashboardCortex(),
    getDashboardTentacles(),
    getDashboardTraces(),
    getDashboardCost(),
  ]);
  return { overview, cortex, tentacles, traces, cost };
}
