/**
 * Phase 1 — derivePipeline unit tests (Node built-in test runner, no extra deps).
 * Run: npm run test:unit
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePipeline } from '../src/lib/derivePipeline.js';

const mockTask = {
  task: {
    task_id: 'task_phase1_mock',
    status: 'running',
    prompt: 'List files in the current directory',
    created_at: '2026-05-30T12:00:00.000Z',
    steps_completed: 0,
    steps_total: 2,
    total_cost: 0.012,
    pipeline: {
      pipeline_id: 'pipe_mock',
      steps: [
        {
          step_id: 1,
          description: 'List directory contents',
          action_type: 'terminal',
          agent_role: 'Operator',
          risk_level: 'low',
          status: 'running',
          verification: {
            type: 'file_exists',
            expression: 'package.json exists',
          },
        },
        {
          step_id: 2,
          description: 'Summarize findings',
          action_type: 'llm_generate',
          risk_level: 'medium',
          status: 'pending',
        },
      ],
    },
    results: [
      {
        step_id: 1,
        output: 'README.md\npackage.json',
        duration_ms: 420,
      },
    ],
  },
};

test('derivePipeline maps wrapped task to Pipeline with contract fields', () => {
  const pipeline = derivePipeline(mockTask, { mode: 'live' });

  assert.equal(pipeline.id, 'task_phase1_mock');
  assert.equal(pipeline.mode, 'live');
  assert.equal(pipeline.intent, 'List files in the current directory');
  assert.equal(pipeline.status, 'running');
  assert.equal(pipeline.steps_total, 2);
  assert.equal(pipeline.steps_completed, 0);
  assert.equal(pipeline.created_date, '2026-05-30T12:00:00.000Z');
  assert.equal(pipeline.actual_cost, 0.012);
  assert.deepEqual(pipeline.forks, []);

  assert.equal(pipeline.steps.length, 2);

  const step0 = pipeline.steps[0];
  assert.equal(step0.id, '1');
  assert.equal(step0.index, 0);
  assert.equal(step0.title, 'List directory contents');
  assert.equal(step0.tool, 'terminal');
  assert.equal(step0.action, 'terminal');
  assert.equal(step0.risk, 'low');
  assert.equal(step0.status, 'running');
  assert.equal(step0.verification.type, 'file_exists');
  assert.equal(step0.verification.expression, 'package.json exists');
  assert.ok(step0.evidence.some((e) => e.type === 'log'));

  const step1 = pipeline.steps[1];
  assert.equal(step1.id, '2');
  assert.equal(step1.tool, 'model');
  assert.equal(step1.risk, 'medium');
  assert.equal(step1.status, 'pending');
});

test('derivePipeline preview mode and empty input are safe', () => {
  const preview = derivePipeline(mockTask.task, { mode: 'preview' });
  assert.equal(preview.mode, 'preview');

  const empty = derivePipeline(null, { mode: 'live' });
  assert.equal(empty.steps.length, 0);
  assert.equal(empty.forks.length, 0);
  assert.equal(empty.status, 'queued');
});
