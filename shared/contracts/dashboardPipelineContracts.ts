/**
 * Dashboard + Pipeline API contracts (shared with backend).
 * Keep field names aligned with Engine JSON responses (snake_case).
 */

export type ApiSource = 'engine' | 'mock';

/** Standard client envelope: typed payload + provenance + UI error string when falling back or partial failure */
export type ApiResult<T> = {
  data: T;
  source: ApiSource;
  /** null on full success; otherwise human-readable reason (Engine unreachable, 4xx/5xx, parse issues, etc.) */
  error: string | null;
};

// --- Dashboard ----------------------------------------------------------------

export type DashboardOverviewPayload = {
  token_saved_pct: number;
  cost_saved_pct: number;
  active_tasks: number;
  unsafe_actions_blocked: number;
  avg_reflex_latency_ms: number;
};

export type DashboardCortexPayload = {
  version: string;
  status: string;
  risk: string;
};

export type DashboardTentaclesPayload = {
  ws_clients: number;
  pending_approvals: number;
  last_heartbeat_ms_ago: number | null;
};

export type DashboardTraceSeverity = 'info' | 'success' | 'warning' | 'critical';

export type DashboardTraceItem = {
  id: string;
  ts: number;
  label: string;
  severity: DashboardTraceSeverity;
};

export type DashboardTracesPayload = {
  traces: DashboardTraceItem[];
};

export type DashboardCostDay = {
  day: string;
  saved: number;
  spent: number;
};

export type DashboardCostPayload = {
  series: DashboardCostDay[];
};

// --- Proof bundle --------------------------------------------------------------

export type ProofBundleArtifact = {
  kind: string;
  uri?: string;
  digest?: string;
  meta?: Record<string, unknown>;
};

export type ProofBundlePayload = {
  capsule_id: string;
  created_at?: string;
  engine_version?: string;
  artifacts: ProofBundleArtifact[];
  summary?: string;
};

// --- Pipeline graph ------------------------------------------------------------

export type CortexPipelineNodeType =
  | 'cortex_step'
  | 'tool_tentacle'
  | 'coherence_gate'
  | 'human_approval'
  | 'sucker_sensor';

export type CortexPipelineNode = {
  id: string;
  type: CortexPipelineNodeType;
  label: string;
  subtitle?: string;
  position: { x: number; y: number };
  meta?: Record<string, unknown>;
  tools?: string[];
};

export type CortexPipelineEdge = {
  id: string;
  from: string;
  to: string;
};

export type CortexPipelineWorkflow = {
  id: string;
  name: string;
  description: string;
  pack?: 'runtime' | 'local' | 'growth';
  nodes: CortexPipelineNode[];
  edges: CortexPipelineEdge[];
  source?: 'template' | 'local';
};

export type PipelineNodesPayload = {
  /** Node palette / catalog the UI can offer when composing a workflow */
  nodes: CortexPipelineNode[];
};

export type PipelineTemplatesPayload = {
  templates: CortexPipelineWorkflow[];
};

export type ValidatePipelineRequestPayload = {
  workflow_id?: string | null;
  nodes: CortexPipelineNode[];
  edges: CortexPipelineEdge[];
};

export type ValidatePipelineResponsePayload = {
  ok: boolean;
  summary?: string;
  warnings: string[];
  errors: string[];
};

export type DryRunPipelineRequestPayload = ValidatePipelineRequestPayload;

export type DryRunPlanStep = {
  step: string;
  status: string;
};

export type DryRunPipelineResponsePayload = {
  proof_mode: boolean;
  rollback_available: boolean;
  trace_recording: boolean;
  estimated_cost_usd: number;
  estimated_tokens: number;
  plan: DryRunPlanStep[];
};
