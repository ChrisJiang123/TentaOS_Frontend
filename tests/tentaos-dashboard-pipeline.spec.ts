// @ts-nocheck — Playwright provides globals; keep jsconfig lean.
import { test, expect, type Page, type TestInfo } from '@playwright/test';

function attachDiagnostics(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });
  page.on('response', (res) => {
    const u = res.url();
    if (res.status() >= 400 && !u.includes('chrome-extension://')) {
      failedResponses.push(`${res.status()} ${u}`);
    }
  });

  return { consoleErrors, pageErrors, failedResponses };
}

async function logDiagnostics(testInfo: TestInfo, label: string, d: ReturnType<typeof attachDiagnostics>) {
  await testInfo.attach(`${label}-console-errors.txt`, {
    body: Buffer.from(d.consoleErrors.join('\n') || '(none)', 'utf8'),
    contentType: 'text/plain',
  });
  await testInfo.attach(`${label}-failed-network.txt`, {
    body: Buffer.from(d.failedResponses.slice(0, 40).join('\n') || '(none)', 'utf8'),
    contentType: 'text/plain',
  });
}

test.describe('Dashboard', () => {
  test('loads KPIs, cortex, tentacle, trace, cost; no blank root', async ({ page }, testInfo) => {
    const d = attachDiagnostics(page);
    await page.goto('/Dashboard', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 60_000 });

    await expect(page.getByTestId('dashboard-overview')).toBeVisible();
    await expect(page.getByTestId('dashboard-overview')).toHaveAttribute('data-overview-loading', 'false', {
      timeout: 45_000,
    });

    await expect(page.getByTestId('dashboard-kpi-token-saved')).toContainText('60%');
    await expect(page.getByTestId('dashboard-kpi-cost-saved')).toContainText('60%');
    await expect(page.getByTestId('dashboard-cortex-state')).toBeVisible();
    const cortexVer = await page.getByTestId('dashboard-cortex-version').textContent();
    expect((cortexVer || '').trim().length).toBeGreaterThan(0);
    await expect(page.getByTestId('dashboard-tentacle-runtime')).toBeVisible();
    await expect(page.getByTestId('dashboard-trace-timeline')).toBeVisible();
    await expect(page.getByTestId('dashboard-cost-chart')).toBeVisible();

    expect(d.pageErrors, `Page errors:\n${d.pageErrors.join('\n')}`).toEqual([]);
    await logDiagnostics(testInfo, 'dashboard', d);
  });
});

test.describe('Pipeline', () => {
  test('palette, inspector, template, validate, dry-run, save, clear, proof pill', async ({ page }, testInfo) => {
    const d = attachDiagnostics(page);
    await page.goto('/PipelineStudio', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('pipeline-page')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('pipeline-page')).toContainText('Cortex Pipeline');
    await expect(page.getByText('BUILD EXECUTION PATH', { exact: false })).toBeVisible();

    // Default workflow may already ship nodes from API/mock; clear so palette adds are deterministic.
    await page.getByTestId('clear-pipeline').first().click();
    await expect(page.locator('[data-testid="pipeline-node-card"]')).toHaveCount(0, { timeout: 15_000 });

    const palette = ['cortex_step', 'tool_tentacle', 'sucker_sensor', 'coherence_gate', 'human_approval'] as const;
    for (let i = 0; i < palette.length; i += 1) {
      await page.getByTestId(`pipeline-palette-${palette[i]}`).click();
      await expect(page.locator('[data-testid="pipeline-node-card"]')).toHaveCount(i + 1);
    }

    // Nodes stack near canvas center; last-added is usually on top and receives clicks.
    await page.locator('[data-testid="pipeline-node-card"]').last().click();
    await expect(page.getByTestId('pipeline-inspector')).toBeVisible();
    await page.getByTestId('pipeline-btn-delete-node').click();
    await expect(page.locator('[data-testid="pipeline-node-card"]')).toHaveCount(4);

    await page.getByTestId('start-cortex-template').first().click();
    await expect(page.locator('[data-testid="pipeline-node-card"]')).toHaveCount(5, { timeout: 20_000 });

    await page.getByTestId('validate-pipeline').click();
    await expect(page.getByTestId('pipeline-last-validate')).toContainText(/OK|Issues found/i, { timeout: 30_000 });

    await page.getByTestId('dry-run-pipeline').click();
    await expect(page.getByTestId('pipeline-last-dry-run')).toContainText(/Proof|Rollback|Source|Engine|Mock/i, {
      timeout: 30_000,
    });

    await page.getByTestId('save-pipeline').click();
    await expect(page.getByText('Pipeline saved locally.', { exact: false })).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('clear-pipeline').click();
    await expect(page.locator('[data-testid="pipeline-node-card"]')).toHaveCount(0, { timeout: 15_000 });

    await expect(page.getByTestId('proof-status-pill')).toBeVisible();

    expect(d.pageErrors, d.pageErrors.join('\n')).toEqual([]);
    await logDiagnostics(testInfo, 'pipeline', d);
  });
});

test.describe('Sidebar routes', () => {
  const routes: { path: string; testId: string }[] = [
    { path: '/Dashboard', testId: 'dashboard-page' },
    { path: '/PipelineStudio', testId: 'pipeline-page' },
    { path: '/Agents', testId: 'agents-page' },
    { path: '/Approvals', testId: 'approvals-page' },
    { path: '/Models', testId: 'models-page' },
    { path: '/Pricing', testId: 'pricing-page' },
    { path: '/Billing', testId: 'billing-page' },
    { path: '/Triggers', testId: 'triggers-page' },
    { path: '/Settings', testId: 'settings-page' },
  ];

  for (const { path, testId } of routes) {
    test(`goto ${path} shows ${testId}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId(testId)).toBeVisible({ timeout: 60_000 });
      const textLen = await page.locator('main').innerText().then((t) => t.trim().length);
      expect(textLen).toBeGreaterThan(30);
    });
  }

  test('click each sidebar link from Dashboard', async ({ page }) => {
    await page.goto('/Dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 60_000 });

    const links: { href: string; testId: string }[] = [
      { href: '/Dashboard', testId: 'dashboard-page' },
      { href: '/PipelineStudio', testId: 'pipeline-page' },
      { href: '/Agents', testId: 'agents-page' },
      { href: '/Approvals', testId: 'approvals-page' },
      { href: '/Models', testId: 'models-page' },
      { href: '/Pricing', testId: 'pricing-page' },
      { href: '/Billing', testId: 'billing-page' },
      { href: '/Triggers', testId: 'triggers-page' },
      { href: '/Settings', testId: 'settings-page' },
    ];

    for (const { href, testId } of links) {
      await page.locator(`nav a[href="${href}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${href.replace(/\//g, '\\/')}`));
      await expect(page.getByTestId(testId)).toBeVisible({ timeout: 30_000 });
    }
  });
});
