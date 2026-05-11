/**
 * SPA smoke: HTTP 200 + index shell for authenticated routes, plus optional
 * post-build bundle markers (no browser; proves shipped JS contains QA hooks).
 *
 * Usage:
 *   npm run build
 *   npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
 *   QA_BASE_URL=http://127.0.0.1:4173 npm run test:qa-smoke
 *
 * Bundle check (no server): after `npm run build`, markers are verified in dist/assets/*.js
 *   QA_SKIP_HTTP=1 npm run test:qa-smoke
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.env.QA_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const skipHttp = process.env.QA_SKIP_HTTP === '1';

const paths = [
  '/Dashboard',
  '/dashboard',
  '/PipelineStudio',
  '/pipeline',
  '/Agents',
  '/agents',
  '/Approvals',
  '/approvals',
  '/Models',
  '/models',
  '/Pricing',
  '/pricing',
  '/Billing',
  '/billing',
  '/Triggers',
  '/triggers',
  '/Settings',
  '/settings',
];

/** Strings that must appear in production JS after build (stable QA / UI markers). */
const bundleMarkers = [
  'dashboard-page',
  'pipeline-page',
  'validate-pipeline',
  'dry-run-pipeline',
  'save-pipeline',
  'clear-pipeline',
  'start-cortex-template',
  'proof-status-pill',
  'pipeline-node-card',
  'Token Saved',
  'Cortex Pipeline',
  'tentaos-pipeline-local-draft-v1',
];

async function check(path) {
  const url = `${base}${path}`;
  let res;
  try {
    res = await fetch(url, { redirect: 'follow' });
  } catch (e) {
    const detail = e?.cause?.message || e?.message || String(e);
    throw new Error(`${path}: fetch failed (${detail}). Is preview running? Try: npm run build && npm run preview -- --host 127.0.0.1 --port 4173`);
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${path}: HTTP ${res.status} ${res.statusText}`);
  }
  if (!text.includes('id="root"')) {
    throw new Error(`${path}: response missing <div id="root"> (not SPA index?)`);
  }
}

function checkBuiltBundleMarkers() {
  const assetsDir = join(process.cwd(), 'dist', 'assets');
  if (!existsSync(assetsDir)) {
    // eslint-disable-next-line no-console
    console.warn('dist/assets not found — skipping bundle marker check (run npm run build first).');
    return;
  }
  const files = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
  let blob = '';
  for (const f of files) {
    blob += readFileSync(join(assetsDir, f), 'utf8');
  }
  for (const s of bundleMarkers) {
    if (!blob.includes(s)) {
      throw new Error(`Built bundle missing marker "${s}" (check dist/assets/*.js after vite build).`);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`  OK  bundle markers (${bundleMarkers.length} strings in dist/assets)`);
}

async function main() {
  if (!skipHttp) {
    // eslint-disable-next-line no-console
    console.log(`QA smoke: GET ${base}/… (${paths.length} paths)`);
    for (const p of paths) {
      await check(p);
      // eslint-disable-next-line no-console
      console.log(`  OK  ${p}`);
    }
    // eslint-disable-next-line no-console
    console.log('All route smoke checks passed.');
  } else {
    // eslint-disable-next-line no-console
    console.log('QA smoke: QA_SKIP_HTTP=1 — skipping HTTP route checks.');
  }

  checkBuiltBundleMarkers();

  // eslint-disable-next-line no-console
  console.log('QA smoke complete.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err?.message || err);
  process.exit(1);
});
