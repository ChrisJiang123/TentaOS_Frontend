/**
 * Phase 10–20 static acceptance checks.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (rel) => readFileSync(join(root, rel), 'utf8');

// Phase 10
assert(read('src/lib/preferencesApi.js').includes('putPreferences'));
assert(read('src/lib/templatesApi.js').includes('createTemplate'));
assert(read('src/components/settings/ExecutionPreferences.jsx').includes('execution-preferences'));
assert(read('src/components/pipeline/PlanPreview.jsx').includes('save-as-template'));
assert(read('src/components/pipeline/CommandBar.jsx').includes('template-picker'));
assert(read('src/lib/planApi.js').includes('loadPreferencesForSubmit'));

// Phase 11–14
assert(read('src/lib/derivePipeline.js').includes('export function deriveFork'));
assert(read('src/components/run/ForkLanes.jsx').includes('fork-lanes'));
assert(read('src/components/run/ForkLanes.jsx').includes('fork-scorecard'));
assert(read('src/lib/pipelineRuntimeStore.js').includes('fork_scored'));
assert(read('src/lib/pipelineRuntimeStore.js').includes('mergeFork'));
assert(read('src/lib/engineClient.js').includes('forkTask'));

// Phase 15
assert(read('src/components/run/Timeline.jsx').includes('run-timeline'));
assert(read('src/components/run/RunView.jsx').includes('Timeline'));

// Phase 16–18
assert(read('src/pages/Metrics.jsx').includes('metrics-page'));
assert(read('src/lib/metricsApi.js').includes('fetchMetrics'));
assert(read('src/pages/Metrics.jsx').includes('可靠性'));

// Phase 17
assert(read('src/components/settings/ExecutionPermissions.jsx').includes('execution-permissions'));

// Phase 19
assert(read('src/lib/authApi.js').includes('migrateLocalAccountData'));
assert(read('src/lib/AuthContext.jsx').includes('loginWithEmail'));
assert(read('src/lib/engineClient.js').includes('_authHeaders'));

// Phase 20
assert(read('src/lib/billingQuota.js').includes('checkTaskQuota'));
assert(read('src/components/pipeline/CommandBar.jsx').includes('checkTaskQuota'));

assert(read('src/App.jsx').includes('/Metrics'));

// eslint-disable-next-line no-console
console.log('phase10-20-advanced.test.mjs: passed');
