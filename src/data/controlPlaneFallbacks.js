// @ts-nocheck
/** Static registries when control-plane APIs are unavailable — no fake live metrics. */

export const STATIC_AGENT_REGISTRY = [
  {
    id: 'agent_planner',
    name: 'Planner',
    role: 'Goal decomposition & step design',
    status: 'active',
    strengths: ['Planning', 'Risk assessment', 'Coherence checks'],
    tools: ['web_search', 'http_client'],
    model_preference: 'reasoning / local cortex',
  },
  {
    id: 'agent_operator',
    name: 'Operator',
    role: 'Tool execution with proof signals',
    status: 'active',
    strengths: ['Local actions', 'Browser automation', 'File ops'],
    tools: ['browser', 'code_executor', 'file_manager'],
    model_preference: 'fast local / BYOK',
  },
  {
    id: 'agent_reviewer',
    name: 'Reviewer',
    role: 'Human-in-the-loop gatekeeper',
    status: 'standby',
    strengths: ['Approval gates', 'Policy checks'],
    tools: [],
    model_preference: 'policy-aware routing',
  },
];

export const STATIC_MODEL_REGISTRY = [
  {
    id: 'model_local_cortex',
    name: 'Local Cortex',
    provider: 'local',
    deployment: 'local',
    strengths: ['Low latency', 'Observable steps', 'Demo-friendly'],
    best_for: ['Pipeline planning', 'Tool routing'],
    speed_tier: 'fast',
    cost_tier: 'low',
    context_tier: 'medium',
    routing_notes: 'Default on demo Engine when BYOK keys are not required.',
    is_active: true,
  },
  {
    id: 'model_byok_general',
    name: 'BYOK General',
    provider: 'openai / anthropic / google',
    deployment: 'cloud',
    strengths: ['Quality', 'Broad tool use'],
    best_for: ['Complex reasoning', 'Long outputs'],
    speed_tier: 'medium',
    cost_tier: 'variable (BYOK)',
    context_tier: 'large',
    routing_notes: 'Bring your own API keys — costs billed by provider, not shown here.',
    is_active: false,
  },
  {
    id: 'model_candidate_fast',
    name: 'Candidate Fast',
    provider: 'candidate pool',
    deployment: 'candidate',
    strengths: ['Cost control', 'Fallback routing'],
    best_for: ['High-volume steps', 'Summarization'],
    speed_tier: 'fast',
    cost_tier: 'low',
    context_tier: 'small',
    routing_notes: 'Used when primary model is unavailable or over budget.',
    is_active: false,
  },
];

export const STATIC_CORTEX_INFO = {
  protocol: 'Cortex Protocol',
  summary:
    'Cortex orchestrates prompt → planned steps → tool/model actions → verifiable results. Each step emits observable events over WebSocket and persists in task.results.',
  layers: [
    { name: 'Intent', description: 'User goal normalized into a task record.' },
    { name: 'Plan', description: 'pipeline.steps with roles, tools, and safety class.' },
    { name: 'Execute', description: 'Tentacles run tools; results merge into task.results.' },
    { name: 'Verify', description: 'Coherence gates & approvals before external writes.' },
  ],
  safety: [
    'Human approval for high-risk actions (external_write, spend, delete).',
    'Routing prefers local/candidate models when policy requires.',
    'All steps traceable in TaskDetail and Cortex Pipeline view.',
  ],
};

export const STATIC_PRICING_INFO = {
  note: 'Static compliant pricing — connect GET /api/pricing for live plan metadata from Engine.',
};

export const APPROVAL_ACTION_EXAMPLES = [
  { type: 'external_write', label: 'External write', risk: 'high', example: 'Modify production config or deploy files' },
  { type: 'spend', label: 'Spend / purchase', risk: 'critical', example: 'Authorize payment or credit consumption' },
  { type: 'delete', label: 'Delete', risk: 'high', example: 'Remove data, repos, or infrastructure' },
  { type: 'send_email', label: 'Send email', risk: 'medium', example: 'Outbound message to external recipients' },
  { type: 'execute_code', label: 'Execute code', risk: 'medium', example: 'Run shell or script with side effects' },
];
