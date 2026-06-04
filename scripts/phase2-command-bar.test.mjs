/**
 * Phase 2 static checks (Command Bar contract).
 * Run: node scripts/phase2-command-bar.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const commandBar = read('src/components/pipeline/CommandBar.jsx');
assert(commandBar.includes('getExampleTasks'), 'example tasks via getExampleTasks');
assert(commandBar.includes('useStrings'), 'i18n useStrings');
assert(commandBar.includes('isComposing'), 'IME guard on Enter');
assert(commandBar.includes('shiftKey'), 'Shift+Enter for newline');
assert(commandBar.includes("variant: 'destructive'"), 'destructive toast on failure');
assert(commandBar.includes('navigate(`/TaskDetail?id='), 'navigate to Run View');
assert(commandBar.includes('disabled={!message.trim()'), 'empty input blocked');
assert(commandBar.includes('data-testid="command-bar"'));

const strings = read('src/i18n/strings.ts');
assert.ok(strings.includes('Run the test suite for this repository'));
assert.ok(strings.includes('Add an email subscribe form'));
assert.ok(strings.includes('Check and fix lint errors'));

const dashboard = read('src/pages/Dashboard.jsx');
assert(dashboard.includes('PipelineChat'));
assert(dashboard.includes('dashboardNoTasksTitle'));
assert(!dashboard.includes('EmergencyStop'), 'global emergency stop removed');

const pipelineChat = read('src/components/pipeline/PipelineChat.jsx');
assert(pipelineChat.includes("import CommandBar from './CommandBar'"));
assert(pipelineChat.includes('<CommandBar'));
assert(pipelineChat.includes('createPlan'), 'design pipeline wired to plan API');

const toast = read('src/components/ui/use-toast.jsx');
assert(toast.includes('TOAST_SUCCESS_MS = 3000'), 'success toast 3s auto-dismiss');

// eslint-disable-next-line no-console
console.log('phase2-command-bar.test.mjs: all static checks passed');
