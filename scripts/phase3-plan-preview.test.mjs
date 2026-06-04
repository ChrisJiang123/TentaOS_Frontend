/**
 * Phase 3 static checks.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (rel) => readFileSync(join(root, rel), 'utf8');

assert(read('src/components/pipeline/PlanPreview.jsx').includes('data-testid="plan-preview"'));
assert(read('src/components/pipeline/PlanPreview.jsx').includes('需审批'));
assert(read('src/components/pipeline/PlanPreview.jsx').includes('plan-preview-launch'));
assert(read('src/lib/planApi.js').includes('buildFallbackPlan'));
assert(read('src/lib/engineApiPaths.js').includes("PLAN: '/api/plan'"));

// eslint-disable-next-line no-console
console.log('phase3-plan-preview.test.mjs: passed');
