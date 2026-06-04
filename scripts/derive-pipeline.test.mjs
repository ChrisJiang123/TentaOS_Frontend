/**
 * Unit test: derivePipeline(mockTask) → contract Pipeline shape.
 * Run: node scripts/derive-pipeline.test.mjs
 */
import assert from 'node:assert/strict';
import { derivePipeline, deriveStep } from '../src/lib/derivePipeline.js';
import { extractTaskAnswer } from '../src/lib/engineTaskUtils.js';

const mockTask = {
  task: {
    id: 'task-abc-123',
    intent: 'Run npm test and fix failures',
    status: 'running',
    steps_completed: 1,
    steps_total: 3,
    created_at: '2026-06-05T10:00:00.000Z',
    actual_cost: 0.42,
    steps: [
      {
        id: 's1',
        title: 'Install dependencies',
        tool: 'terminal',
        action: 'npm ci',
        risk: 'low',
        status: 'passed',
        verification: {
          type: 'test',
          expression: 'npm test',
          result: 'pass',
          detail: 'npm test passed',
        },
        evidence: [{ type: 'terminal', ref: 'term://s1', label: 'install log' }],
        checkpoint_id: 'cp-1',
      },
      {
        step_id: 's2',
        task: 'Run test suite',
        role: 'Coder',
        risk: 'high',
        status: 'running',
        verification: { type: 'test', expression: 'npm test' },
      },
      {
        step_id: 's3',
        title: 'Deploy preview',
        tool: 'browser',
        risk: 'medium',
        status: 'pending',
      },
    ],
    verification_summary: {
      checks: [{ type: 'test', result: 'pass', detail: 'all green' }],
      duration_ms: 120000,
      cost: 0.42,
    },
    forks: [],
  },
};

function assertPipelineShape(p) {
  assert.ok(p, 'derivePipeline returned null');
  assert.equal(p.taskId, 'task-abc-123');
  assert.equal(p.mode, 'live');
  assert.equal(p.title, 'Run npm test and fix failures');
  assert.equal(p.intent, 'Run npm test and fix failures');
  assert.equal(p.status, 'running');
  assert.equal(p.steps.length, 3);
  assert.equal(p.steps_completed, 1);
  assert.equal(p.steps_total, 3);
  assert.equal(p.forks.length, 0);
  assert.ok(p.created_date);
  assert.equal(p.actual_cost, 0.42);
  assert.ok(p.verification_summary?.checks?.length === 1);

  const s0 = p.steps[0];
  assert.equal(s0.id, 's1');
  assert.equal(s0.index, 0);
  assert.equal(s0.title, 'Install dependencies');
  assert.equal(s0.tool, 'terminal');
  assert.equal(s0.action, 'npm ci');
  assert.equal(s0.risk, 'low');
  assert.equal(s0.status, 'passed');
  assert.equal(s0.verification.type, 'test');
  assert.equal(s0.verification.result, 'pass');
  assert.equal(s0.evidence.length, 1);
  assert.equal(s0.checkpointId, 'cp-1');

  const s1 = p.steps[1];
  assert.equal(s1.status, 'running');
  assert.equal(s1.risk, 'high');
  assert.equal(s1.tool, 'terminal');
  assert.equal(s1.verification.expression, 'npm test');
  assert.equal(s1.verification.result, undefined, 'no result until verified');

  const s2 = p.steps[2];
  assert.equal(s2.tool, 'browser');
  assert.equal(s2.status, 'pending');
}

assertPipelineShape(derivePipeline(mockTask, { mode: 'live' }));

const preview = derivePipeline(mockTask.task, { mode: 'preview' });
assert.equal(preview.mode, 'preview');

const step = deriveStep({ step_id: 'x', status: 'completed', risk: 'LOW' }, 0);
assert.equal(step.status, 'passed');
assert.equal(step.risk, 'low');

assert.equal(extractTaskAnswer({ answer: '最终回答' }), '最终回答');
assert.equal(extractTaskAnswer({ result: { answer: 'from result' } }), 'from result');
assert.equal(extractTaskAnswer({ output_text: 'from output' }), 'from output');
assert.equal(
  extractTaskAnswer({ answer: 'primary', result: { answer: 'secondary' } }),
  'primary',
);

const withAnswer = derivePipeline(
  {
    task: {
      ...mockTask.task,
      status: 'completed',
      answer: '任务完成后的总结',
    },
  },
  { mode: 'replay' },
);
assert.equal(withAnswer.answer, '任务完成后的总结');

// eslint-disable-next-line no-console
console.log('derive-pipeline.test.mjs: all assertions passed');
