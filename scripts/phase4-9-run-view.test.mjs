/**
 * Phase 4–9 static acceptance checks.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const runtime = read('src/lib/pipelineRuntimeStore.js');
assert(runtime.includes('RUN_POLL_MS = 4000'));
assert(runtime.includes('terminal_output'));
assert(runtime.includes('verification_result'));
assert(runtime.includes('checkpoint_created'));
assert(runtime.includes('rollbackTask'));
assert(runtime.includes('stopTask'), 'single-task stop');
assert(runtime.includes('refreshFromHttp'), 'poll truth source after stop');

const runView = read('src/components/run/RunView.jsx');
assert(runView.includes('RunStatusBar'));
assert(runView.includes('EvidencePanel'));
assert(runView.includes('PipelineStepList'));
const runStatusBar = read('src/components/run/RunStatusBar.jsx');
assert(runStatusBar.includes('run-status-bar'));
assert(runStatusBar.includes('isTerminalEngineStatus'), 'hide status bar on terminal');

const evidence = read('src/components/run/EvidencePanel.jsx');
assert(evidence.includes('diff'));

const verification = read('src/lib/taskVerification.js');
assert(verification.includes('verifyPending') || verification.includes('Pending verification'));
assert(verification.includes('getDisplayTaskStatus'));

const taskDetail = read('src/pages/TaskDetail.jsx');
assert(taskDetail.includes("'replay'"));

const taskCard = read('src/components/dashboard/TaskCard.jsx');
assert(taskCard.includes('mode=replay'));

const dashboard = read('src/pages/Dashboard.jsx');
assert(dashboard.includes('5000'));
assert(dashboard.includes('runs-list'));

const sidebar = read('src/components/layout/Sidebar.jsx');
assert(sidebar.includes('usePendingApprovalsCount'));

const engine = read('src/lib/engineClient.js');
assert(engine.includes('fetchTaskDiff'));
assert(engine.includes('rollbackTask'));
assert(engine.includes('stopTask'));
assert(engine.includes('fetchScreenshot'));

// eslint-disable-next-line no-console
console.log('phase4-9-run-view.test.mjs: passed');
