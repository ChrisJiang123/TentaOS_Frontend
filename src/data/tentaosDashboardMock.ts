import type {
  CortexPipelineNode,
  CortexPipelineWorkflow,
  ProofBundlePayload,
  ValidatePipelineResponsePayload,
  DryRunPipelineResponsePayload,
} from '../../shared/contracts/dashboardPipelineContracts';

export type {
  CortexPipelineNodeType,
  CortexPipelineNode,
  CortexPipelineWorkflow,
  CortexPipelineEdge,
} from '../../shared/contracts/dashboardPipelineContracts';

export const cortexPipelineTemplateDeploymentHealthCheck: CortexPipelineWorkflow = {
  id: 'wf_cortex_deployment_health_check',
  name: 'Deployment Health Check',
  description: 'Verify frontend ↔ engine connectivity with proof, trace and rollback.',
  pack: 'runtime',
  source: 'template',
  nodes: [
    {
      id: 'n1',
      type: 'sucker_sensor',
      label: 'Sucker Sensor',
      subtitle: 'Probe local evidence',
      position: { x: 80, y: 90 },
      meta: { probe: ['GET /api/health', 'ws handshake', 'latency sample'] },
    },
    {
      id: 'n2',
      type: 'cortex_step',
      label: 'Cortex Step',
      subtitle: 'Planning or reasoning step',
      position: { x: 360, y: 90 },
      meta: { reads: 'projected task state', proposes: 'next action' },
    },
    {
      id: 'n3',
      type: 'tool_tentacle',
      label: 'Tool Tentacle',
      subtitle: 'Local action unit',
      position: { x: 640, y: 90 },
      meta: { tools: ['http_client', 'browser', 'code_executor'] },
    },
    {
      id: 'n4',
      type: 'coherence_gate',
      label: 'Coherence Gate',
      subtitle: 'Branch by state or risk',
      position: { x: 360, y: 250 },
      meta: { checks: ['CORS ok', 'ws stable', 'no 404 spam'] },
    },
    {
      id: 'n5',
      type: 'human_approval',
      label: 'Human Approval',
      subtitle: 'Pause for review',
      position: { x: 640, y: 250 },
      meta: { sensitive: true },
    },
  ],
  edges: [
    { id: 'e1', from: 'n1', to: 'n2' },
    { id: 'e2', from: 'n2', to: 'n3' },
    { id: 'e3', from: 'n3', to: 'n4' },
    { id: 'e4', from: 'n4', to: 'n5' },
  ],
};

export const cortexPipelineWorkflowsMock: CortexPipelineWorkflow[] = [cortexPipelineTemplateDeploymentHealthCheck];

/** Palette-style catalog when GET /api/pipeline/nodes is unavailable */
export const pipelineCatalogNodesMock: CortexPipelineNode[] = [
  {
    id: 'cat_sucker',
    type: 'sucker_sensor',
    label: 'Sucker Sensor',
    subtitle: 'Catalog',
    position: { x: 0, y: 0 },
  },
  {
    id: 'cat_cortex',
    type: 'cortex_step',
    label: 'Cortex Step',
    subtitle: 'Catalog',
    position: { x: 0, y: 0 },
  },
  {
    id: 'cat_tool',
    type: 'tool_tentacle',
    label: 'Tool Tentacle',
    subtitle: 'Catalog',
    position: { x: 0, y: 0 },
  },
  {
    id: 'cat_gate',
    type: 'coherence_gate',
    label: 'Coherence Gate',
    subtitle: 'Catalog',
    position: { x: 0, y: 0 },
  },
  {
    id: 'cat_human',
    type: 'human_approval',
    label: 'Human Approval',
    subtitle: 'Catalog',
    position: { x: 0, y: 0 },
  },
];

export const pipelineMockValidation: ValidatePipelineResponsePayload = {
  ok: true,
  summary: 'Pipeline is coherent and safe to dry-run.',
  warnings: ['One step has no explicit rollback hint; default rollback will be used.'],
  errors: [],
};

export const pipelineMockDryRun: DryRunPipelineResponsePayload = {
  proof_mode: true,
  rollback_available: true,
  trace_recording: true,
  estimated_cost_usd: 0.06,
  estimated_tokens: 4200,
  plan: [
    { step: 'Probe /api/health', status: 'ready' },
    { step: 'Open WS and listen for heartbeat', status: 'ready' },
    { step: 'Submit a trivial no-op task', status: 'ready' },
  ],
};

export function proofBundleMockForCapsule(capsuleId: string): ProofBundlePayload {
  return {
    capsule_id: capsuleId,
    created_at: new Date().toISOString(),
    artifacts: [{ kind: 'mock', digest: 'local-mock', meta: { reason: 'engine_unavailable' } }],
    summary: 'Mock proof bundle (Engine unavailable or endpoint missing).',
  };
}

export const dashboardMock = {
  token_saved_pct: 60,
  cost_saved_pct: 60,
  active_tasks: 2,
  unsafe_actions_blocked: 3,
  avg_reflex_latency_ms: 180,
  cortex_state: {
    version: 'v0.14',
    status: 'Verifying',
    risk: 'Low',
  },
  tentacle_runtime: {
    ws_clients: 1,
    pending_approvals: 0,
    last_heartbeat_ms_ago: 2100,
  },
  recent_traces: [
    { id: 'tr_001', ts: Date.now() - 1000 * 60 * 2, label: 'Connected to Engine WS', severity: 'info' as const },
    { id: 'tr_002', ts: Date.now() - 1000 * 60 * 1, label: 'Health check OK', severity: 'success' as const },
    { id: 'tr_003', ts: Date.now() - 1000 * 20, label: 'No unsafe actions detected', severity: 'success' as const },
  ],
  cost_series_7d: [
    { day: 'Mon', saved: 0.22, spent: 0.14 },
    { day: 'Tue', saved: 0.3, spent: 0.17 },
    { day: 'Wed', saved: 0.25, spent: 0.16 },
    { day: 'Thu', saved: 0.34, spent: 0.18 },
    { day: 'Fri', saved: 0.28, spent: 0.15 },
    { day: 'Sat', saved: 0.31, spent: 0.19 },
    { day: 'Sun', saved: 0.36, spent: 0.21 },
  ],
};

export const agentsMock = [
  {
    id: 'ag_planner',
    name: 'Planner',
    model_id: 'local/planner',
    permission_level: 'suggest',
    avatar_color: '#38BDF8',
    is_active: true,
    tasks_completed: 18,
    tasks_failed: 1,
    total_tokens: 820_000,
    total_cost: 2.14,
    system_prompt: 'Reads projected state and proposes next actions.',
    capabilities: ['planning', 'risk_assessment'],
    tools: ['web_search', 'http_client'],
    max_retries: 2,
  },
  {
    id: 'ag_operator',
    name: 'Operator',
    model_id: 'local/operator',
    permission_level: 'execute',
    avatar_color: '#34D399',
    is_active: true,
    tasks_completed: 11,
    tasks_failed: 0,
    total_tokens: 430_000,
    total_cost: 1.02,
    system_prompt: 'Executes local actions with proof and rollback signals.',
    capabilities: ['execution', 'tool_use'],
    tools: ['browser', 'code_executor', 'file_manager'],
    max_retries: 1,
  },
];

export const approvalsMock = [
  {
    id: 'ap_001',
    status: 'pending',
    risk_level: 'medium',
    action_type: 'external_write',
    summary: 'Update a configuration file on production.',
    task_title: 'Frontend-backend health check',
    agent_name: 'Operator',
    created_date: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    preview_data: '{ "file": "vercel.json", "change": "rewrite rules" }',
  },
];

export const modelsMock = [
  {
    id: 'm1',
    provider: 'local',
    display_name: 'Local Cortex',
    model_id: 'local/cortex-v0.14',
    tasks_routed: 22,
    total_tokens: 1_240_000,
    total_cost: 0,
    avg_latency_ms: 160,
    is_active: true,
  },
  {
    id: 'm2',
    provider: 'openai',
    display_name: 'GPT-4.1 (BYOK)',
    model_id: 'openai/gpt-4.1',
    tasks_routed: 7,
    total_tokens: 330_000,
    total_cost: 1.27,
    avg_latency_ms: 420,
    is_active: false,
  },
];

export const triggersMock = [
  {
    id: 'trg_1',
    name: 'Nightly Health Probe',
    type: 'schedule',
    schedule: '0 3 * * *',
    is_active: true,
    trigger_count: 12,
    last_fired_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: 'trg_2',
    name: 'Manual API Trigger',
    type: 'api',
    is_active: false,
    trigger_count: 2,
    last_fired_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
];
