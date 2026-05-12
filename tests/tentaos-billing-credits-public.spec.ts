// @ts-nocheck — Playwright provides globals; keep jsconfig lean.
import { test, expect } from '@playwright/test';

function json(body) {
  return {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function setupMocks(page, { billingOk = true, credits = 12500, status = 'trialing', plan = 'free' } = {}) {
  // Ensure "new user" state is stable (no persisted engine tasks).
  page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });

  page.route('**/api/users/me', async (route) => {
    await route.fulfill(json({ email: 'new.user@tentaos.test', full_name: 'New User' }));
  });

  page.route('**/api/billing/me', async (route) => {
    if (!billingOk) {
      await route.fulfill({
        status: 503,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Billing is not connected yet.' }),
      });
      return;
    }
    await route.fulfill(
      json({
        provider: 'Creem',
        plan,
        status,
        credits_balance: credits,
        monthly_allowance: 10000,
        ledger: [
          {
            id: 'tx_usage_1',
            type: 'USAGE',
            amount: -1200,
            estimated_cost: 0.36,
            created_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
            description: 'Sample usage',
          },
        ],
        creem_customer_id: 'cus_test_123',
        creem_subscription_id: 'sub_test_456',
      }),
    );
  });
}

test.describe('Billing/Credits/Public QA', () => {
  test('1) new user Dashboard shows Explore Mode, not blank', async ({ page }) => {
    setupMocks(page, { billingOk: true, credits: 500, status: 'trialing', plan: 'free' });

    // Force engine offline to validate "not scary" UI.
    await page.route('**/api/health', async (route) => {
      await route.fulfill({ status: 503, body: 'offline' });
    });

    await page.goto('/Dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    // Explore Mode (WelcomeGuide) should appear for empty tasks.
    await expect(page.getByText('欢迎来到 TentaOS')).toBeVisible();
    await expect(page.getByText('从健康检查开始')).toBeVisible();
    await expect(page.getByText('升级或购买积分')).toBeVisible();

    // Engine offline message should be gentle (no "失败" scary error).
    await expect(page.getByTestId('dashboard-health-error')).toContainText('演示/Mock');
    await expect(page.getByTestId('dashboard-health-error')).not.toContainText('失败');
  });

  test('2) credit balance appears on Dashboard + 5) Billing shows plan/status/credits', async ({ page }) => {
    setupMocks(page, { billingOk: true, credits: 12000, status: 'active', plan: 'pro_hosted' });

    await page.goto('/Dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('12,000 credits', { exact: false }).first()).toBeVisible();

    await page.goto('/Billing', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('billing-page')).toBeVisible();
    await expect(page.getByText(/Credit Balance/i)).toBeVisible();
    await expect(page.getByText('12,000', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Billing provider', { exact: true })).toBeVisible();
    await expect(page.getByText('Creem', { exact: true }).first()).toBeVisible();
  });

  test('3) /pricing loads, 9) footer links work, 10) disclaimers visible', async ({ page }) => {
    setupMocks(page, { billingOk: true, credits: 1234, status: 'trialing', plan: 'free' });

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('pricing-page')).toBeVisible();

    // Disclaimers in footer
    await expect(
      page.getByText('Payments are processed by third-party payment providers. TentaOS does not store full card details.'),
    ).toBeVisible();
    await expect(
      page.getByText('TentaOS is an independent software platform and is not affiliated with OpenAI'),
    ).toBeVisible();

    // Footer links work (spot-check: Terms + Privacy)
    await page.getByRole('link', { name: 'Terms of Service' }).first().click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();

    await page.getByRole('link', { name: 'Privacy Policy' }).first().click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('4) Paid CTA calls checkout endpoint and redirects (mocked), and shows visible error on failure', async ({ page }) => {
    setupMocks(page, { billingOk: true, credits: 999, status: 'trialing', plan: 'free' });

    // Success path: return a same-origin URL so test can continue.
    await page.route('**/api/billing/creem/checkout', async (route) => {
      await route.fulfill(
        json({
          checkout_url: '/billing/success?checkout_id=chk_test_1&order_id=ord_test_1&customer_id=cus_test_1&product_id=plan_pro&request_id=req_test_1',
        }),
      );
    });

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('pricing-page')).toBeVisible();

    await page.getByRole('button', { name: '订阅 Pro' }).click();
    await expect(page).toHaveURL(/\/billing\/success/);
    await expect(page.getByText('Payment received')).toBeVisible();

    // Failure path: 500 should produce a visible error banner on pricing page.
    await page.route('**/api/billing/creem/checkout', async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Billing is not connected yet.' }),
      });
    });

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '订阅 Pro' }).click();
    await expect(page.getByText('无法发起结账')).toBeVisible();
  });

  test('6) success page loads with fake query params and refreshes billing', async ({ page }) => {
    setupMocks(page, { billingOk: true, credits: 20000, status: 'active', plan: 'pro_hosted' });

    await page.goto(
      '/billing/success?checkout_id=chk_fake&order_id=ord_fake&customer_id=cus_fake&product_id=credits_medium&request_id=req_fake',
      { waitUntil: 'domcontentloaded' },
    );
    await expect(page.getByText('Payment received')).toBeVisible();
    await expect(page.getByText('checkout_id')).toBeVisible();
    await expect(page.getByText('chk_fake')).toBeVisible();
    await expect(page.getByText(/20,000|20000/)).toBeVisible();
  });

  test('8) public legal/support pages load', async ({ page }) => {
    setupMocks(page, { billingOk: false });

    const cases = [
      { path: '/pricing', h: 'Simple pricing' },
      { path: '/terms', h: 'Terms of Service' },
      { path: '/privacy', h: 'Privacy Policy' },
      { path: '/refund', h: 'Refund Policy' },
      { path: '/contact', h: 'Contact' },
      { path: '/support', h: 'Support' },
    ];

    for (const c of cases) {
      await page.goto(c.path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: c.h })).toBeVisible();
      const len = await page.locator('body').innerText().then((t) => t.trim().length);
      expect(len).toBeGreaterThan(50);
    }
  });
});

