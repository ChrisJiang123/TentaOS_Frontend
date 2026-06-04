/**
 * Phase 2 static checks (Command Bar contract).
 * Run: node scripts/phase2-command-bar.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const commandBar = read('src/components/pipeline/CommandBar.jsx');
assert(commandBar.includes('EXAMPLE_TASKS'), 'example tasks defined');
assert.ok(commandBar.includes('把这个仓库的测试跑通'));
assert.ok(commandBar.includes('给落地页加一个邮箱订阅表单'));
assert.ok(commandBar.includes('检查并修复 lint 错误'));
assert(commandBar.includes("variant: 'destructive'"), 'destructive toast on failure');
assert(commandBar.includes('navigate(`/TaskDetail?id='), 'navigate to Run View');
assert(commandBar.includes('disabled={!message.trim()'), 'empty input blocked');
assert(commandBar.includes('data-testid="command-bar"'));

const dashboard = read('src/pages/Dashboard.jsx');
assert(dashboard.includes('PipelineChat'));
assert(dashboard.includes('还没有任务'));

const pipelineChat = read('src/components/pipeline/PipelineChat.jsx');
assert(pipelineChat.includes("import CommandBar from './CommandBar'"));
assert(pipelineChat.includes('<CommandBar'));

// eslint-disable-next-line no-console
console.log('phase2-command-bar.test.mjs: all static checks passed');
