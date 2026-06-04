// @ts-nocheck
/**
 * Phase 1–20 + Engine 联调 — Playwright 验收（公网 Engine 默认可达）
 */
import { test, expect, type Page, type TestInfo } from '@playwright/test';

const ENGINE_PLAN_TIMEOUT = 90_000;
const ENGINE_TASK_TIMEOUT = 120_000;

function attachDiagnostics(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (res) => {
    const u = res.url();
    if (
      res.status() >= 400 &&
      !u.includes('chrome-extension://') &&
      (u.includes('engine.tentaos.com') || u.includes('/api/'))
    ) {
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
    body: Buffer.from(d.failedResponses.slice(0, 50).join('\n') || '(none)', 'utf8'),
    contentType: 'text/plain',
  });
}

async function waitForDashboardReady(page: Page) {
  await page.goto('/Dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('command-bar')).toBeVisible({ timeout: 120_000 });
}

test.describe('Pipeline + Engine (P1–9)', () => {
  test('CommandBar: examples, plan preview, launch → Run View', async ({ page }, testInfo) => {
    test.setTimeout(ENGINE_TASK_TIMEOUT + 60_000);
    const d = attachDiagnostics(page);
    await waitForDashboardReady(page);

    await expect(page.getByTestId('example-task-tests')).toBeVisible();
    await page.getByTestId('example-task-tests').click();
    await expect(page.getByTestId('command-bar').locator('textarea')).toHaveValue(/测试/);

    await page.getByTestId('command-bar-submit').click();

    await expect(page.getByTestId('plan-preview')).toBeVisible({ timeout: ENGINE_PLAN_TIMEOUT });
    await expect(page.getByTestId('plan-preview')).toContainText(/risk|验证|Step/i);
    const stepCards = page.getByTestId('plan-preview').locator('li');
    expect(await stepCards.count()).toBeGreaterThan(0);

    await page.getByTestId('plan-preview-launch').click();

    await expect(page).toHaveURL(/\/TaskDetail\?id=/, { timeout: ENGINE_TASK_TIMEOUT });
    await expect(page.getByTestId('run-view')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('run-status-bar')).toBeVisible();
    await expect(page.getByTestId('pipeline-step-list')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('evidence-panel')).toBeVisible();

    const fatalPageErrors = d.pageErrors.filter((e) => !/ResizeObserver|Non-Error/i.test(e));
    expect(fatalPageErrors, fatalPageErrors.join('\n')).toEqual([]);
    await logDiagnostics(testInfo, 'plan-launch', d);
  });

  test('Settings: execution preferences + permissions sections', async ({ page }, testInfo) => {
    const d = attachDiagnostics(page);
    await page.goto('/Settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('settings-page')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('execution-preferences')).toBeVisible();
    await expect(page.getByTestId('save-preferences')).toBeVisible();
    await expect(page.getByTestId('execution-permissions')).toBeVisible();
    expect(d.pageErrors).toEqual([]);
    await logDiagnostics(testInfo, 'settings', d);
  });

  test('Metrics page loads KPI and charts', async ({ page }, testInfo) => {
    const d = attachDiagnostics(page);
    await page.goto('/Metrics', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('metrics-page')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: '可观测' })).toBeVisible();
    await expect(page.getByText('可靠性（Phase 18）')).toBeVisible();
    expect(d.pageErrors).toEqual([]);
    await logDiagnostics(testInfo, 'metrics', d);
  });

  test('Runs list + replay link when tasks exist', async ({ page }, testInfo) => {
    const d = attachDiagnostics(page);
    await waitForDashboardReady(page);
    await expect(page.getByTestId('runs-list')).toBeVisible();

    const taskLink = page.locator('[data-testid="runs-list"] a[href*="TaskDetail"]').first();
    const count = await taskLink.count();
    if (count === 0) {
      testInfo.annotations.push({
        type: 'note',
        description: 'No historical tasks on Engine — skipped replay navigation',
      });
      return;
    }

    await taskLink.click();
    await expect(page).toHaveURL(/TaskDetail.*mode=replay|TaskDetail\?id=/);
    await expect(page.getByTestId('run-view')).toBeVisible({ timeout: 60_000 });
    await logDiagnostics(testInfo, 'replay', d);
  });
});

test.describe('Sidebar (extended routes)', () => {
  test('Metrics link in nav', async ({ page }) => {
    await waitForDashboardReady(page);
    await page.locator('nav a[href="/Metrics"]').first().click();
    await expect(page).toHaveURL(/\/Metrics/);
    await expect(page.getByTestId('metrics-page')).toBeVisible({ timeout: 30_000 });
  });
});
