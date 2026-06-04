// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Landing compliance', () => {
  test('no fake animated counters; trust section visible; no placeholder href="#"', async ({ page }) => {
    await page.goto('/Landing', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Built for reliable AI execution')).toBeVisible();
    await expect(page.getByText('Multi-model orchestration')).toBeVisible();
    await expect(page.getByText('Human approval before risky actions')).toBeVisible();

    await expect(page.getByText('Tasks Completed')).toHaveCount(0);
    await expect(page.getByText('Cost Saved')).toHaveCount(0);

    const hashLinks = page.locator('footer a[href="#"]');
    await expect(hashLinks).toHaveCount(0);

    await page.screenshot({ path: 'test-results/landing-compliance-desktop.png', fullPage: true });
  });

  test('mobile layout loads without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/Landing', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Built for reliable AI execution')).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow).toBe(false);

    await page.screenshot({ path: 'test-results/landing-compliance-mobile.png', fullPage: true });
  });
});
