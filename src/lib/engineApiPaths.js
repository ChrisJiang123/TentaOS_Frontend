// @ts-nocheck
/** Canonical Engine REST paths (local backend contract). */

export const ENGINE_PATHS = {
  HEALTH: '/api/health',
  TASK_SUBMIT: '/api/task',
  TASKS_LIST: '/api/tasks',
  taskById: (taskId) => `/api/tasks/${encodeURIComponent(taskId)}`,
  AGENTS: '/api/agents',
  MODELS: '/api/models',
  TRIGGERS: '/api/triggers',
  triggerById: (id) => `/api/triggers/${encodeURIComponent(id)}`,
  PRICING: '/api/pricing',
  CONTROL_PLANE_STATUS: '/api/control-plane/status',
  CORTEX: '/api/cortex',
  APPROVALS: '/api/approvals',
  approvalById: (id) => `/api/approvals/${encodeURIComponent(id)}`,
  STOP: '/api/stop',
};

/** Paths always allowed when Engine URL is set (demo / local integration). */
export const ENGINE_CORE_PATHS = new Set([
  ENGINE_PATHS.HEALTH,
  ENGINE_PATHS.TASK_SUBMIT,
  ENGINE_PATHS.TASKS_LIST,
]);

export function isTaskSubmitPath(path) {
  return path === ENGINE_PATHS.TASK_SUBMIT;
}

export function isTaskReadPath(path) {
  return (
    path === ENGINE_PATHS.TASKS_LIST ||
    path === ENGINE_PATHS.TASK_SUBMIT ||
    /^\/api\/tasks\/[^/]+$/.test(path) ||
    /^\/api\/task\/[^/]+$/.test(path)
  );
}

export function isHealthPath(path) {
  return path === ENGINE_PATHS.HEALTH;
}

/** Billing & account (Creem checkout is server-side; no API keys in frontend). */
export function isBillingPath(path) {
  return (
    path === '/api/users/me' ||
    path === '/api/billing/me' ||
    path === '/api/billing/creem/checkout' ||
    path.startsWith('/api/billing/')
  );
}

/**
 * Extended dashboard/approvals APIs — off unless VITE_ENGINE_EXTENDED_API=true.
 */
export function isLocalEngineCoreMode() {
  return import.meta.env.VITE_ENGINE_EXTENDED_API !== 'true';
}

export function isEnginePathAllowed(path, method = 'GET') {
  if (isHealthPath(path) || isTaskSubmitPath(path) || isTaskReadPath(path)) {
    return true;
  }
  if (isBillingPath(path)) {
    return true;
  }
  if (import.meta.env.VITE_ENGINE_EXTENDED_API === 'true') {
    return true;
  }
  return false;
}

export function isEngineApiSkippedError(err) {
  if (!err) return false;
  if (typeof err === 'object' && err.code === 'ENGINE_API_SKIPPED') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('Engine API skipped') || msg.includes('not in local contract');
}
