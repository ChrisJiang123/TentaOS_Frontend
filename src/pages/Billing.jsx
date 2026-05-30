// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import SubscriptionCard from '../components/billing/SubscriptionCard';
import CreditBalance from '../components/billing/CreditBalance';
import TransactionTable from '../components/billing/TransactionTable';
import UsageChart from '../components/billing/UsageChart';
import BillingStatusPanel from '@/components/pricing/BillingStatusPanel';
import TentaOSProCard from '@/components/pricing/TentaOSProCard';
import { Button } from '@/components/ui/button';
import { fetchBillingMe } from '@/lib/billingAccountApi';
import { startCreemCheckout, redirectToCheckout } from '@/lib/billingCheckout';
import { formatCostShort, safeNumber } from '@/lib/formatNumbers';

export default function Billing() {
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const billing = useQuery({
    queryKey: ['billing-me'],
    queryFn: () => fetchBillingMe({ timeoutMs: 12_000 }),
    retry: 0,
    staleTime: 30_000,
  });

  const subscription = useMemo(() => {
    const b = billing.data || {};
    const plan = b.plan ?? b.tier ?? 'free';
    const status = b.status ?? (billing.isError ? 'unknown' : 'active');
    const amount = Number(b.amount ?? b.price_usd ?? 0);
    const monthly_credit_limit = b.monthly_allowance ?? b.monthly_credit_limit ?? b.monthly_credits ?? 0;
    const credits_balance = b.credits_balance ?? b.credits ?? b.balance ?? 0;
    const credits_used_this_month = b.credits_used_this_month ?? b.used_month ?? 0;
    const credits_used_today = b.credits_used_today ?? b.used_today ?? 0;
    const ledger = Array.isArray(b.ledger) ? b.ledger : Array.isArray(b.transactions) ? b.transactions : [];

    return {
      plan,
      status,
      amount,
      current_period_end: b.current_period_end ?? b.period_end ?? null,
      credits_balance,
      monthly_credit_limit: monthly_credit_limit || 0,
      credits_used_this_month,
      credits_used_today,
      ledger,
      provider: b.provider ?? 'Creem',
      billing_mode: b.billing_mode ?? b.mode ?? undefined,
      hosted: b.hosted ?? undefined,
      creem_customer_id: b.creem_customer_id ?? b.customer_id ?? null,
      creem_subscription_id: b.creem_subscription_id ?? b.subscription_id ?? null,
    };
  }, [billing.data, billing.isError]);

  const isPaid = !['free', 'local'].includes(String(subscription.plan || '').toLowerCase());
  const isHosted = Boolean(subscription.billing_mode === 'hosted' || subscription.hosted === true);
  const billingConnected = !billing.isLoading && !billing.isError && billing.data != null;

  async function startCheckout(productKey) {
    if (!billingConnected) {
      setCheckoutError('Billing is not connected yet. Checkout requires a configured Creem endpoint on the Engine.');
      return;
    }
    setCheckoutError('');
    setCheckoutLoading(true);
    try {
      const { checkoutUrl } = await startCreemCheckout({ product: productKey });
      redirectToCheckout(checkoutUrl);
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : String(e));
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div data-testid="billing-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Billing & Usage</h1>
            <p className="text-sm text-white/40">Manage your subscription and credits</p>
          </div>
        </div>

        <div className="space-y-6">
          <BillingStatusPanel showUpgradeLink={false} />

          {!isPaid && (
            <TentaOSProCard onCheckoutError={setCheckoutError} compact />
          )}

          <div className={`grid gap-6 ${isHosted ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'}`}>
            <SubscriptionCard subscription={subscription} billingProviderConnected={!billing.isError} />
            <CreditBalance subscription={subscription} onBuyCredits={() => startCheckout('credits_medium')} />
          </div>

          <CostSummary subscription={subscription} isHosted={isHosted} billingConnected={billingConnected} />

          {!billingConnected && !billing.isLoading && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-sm text-white/45">
              <p className="font-medium text-white/70 mb-2">Early access — billing not connected</p>
              <p className="mb-4">
                Checkout and paid status require Engine endpoints{' '}
                <code className="text-white/35">/api/billing/me</code> and Creem checkout. We never imply a
                successful payment unless the backend confirms it.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] font-medium"
              >
                Request access / onboarding →
              </Link>
            </div>
          )}

          {billing.isError && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-amber-300/90 text-sm">
              计费服务暂不可用：不会显示虚假的已付费订阅或余额。
              <div className="text-xs text-white/45 mt-2">
                {billing.error instanceof Error ? billing.error.message : String(billing.error)}
              </div>
            </div>
          )}

          {checkoutError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-300/90 text-sm">
              无法发起结账：{checkoutError}
              <div className="text-xs text-white/45 mt-2">若计费未接入，将提示 “Billing is not connected yet.”</div>
            </div>
          )}

          {!billing.isError && !isPaid && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white/80">你当前没有付费订阅</p>
                  <p className="text-xs text-white/40 mt-1">升级方案或购买积分以解锁更高用量。</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/pricing">
                    <Button className="bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90">去升级</Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="border-white/10 text-white/70 hover:text-white bg-transparent hover:bg-white/5"
                    onClick={() => startCheckout('credits_small')}
                    disabled={checkoutLoading || !billingConnected}
                  >
                    {checkoutLoading ? '跳转中…' : billingConnected ? '购买积分' : 'Checkout unavailable'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UsageChart transactions={subscription.ledger || []} />
            <AdvancedSection subscription={subscription} />
          </div>

          <TransactionTable transactions={subscription.ledger || []} />
        </div>
      </div>
    </div>
  );
}

function CostSummary({ subscription, isHosted, billingConnected }) {
  if (!billingConnected) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-medium text-white/50 mb-2">Cost Breakdown</h3>
        <p className="text-sm text-white/40">
          Early access — cost breakdown appears when billing is connected via{' '}
          <code className="text-white/35">/api/billing/me</code>. No estimated charges are shown.
        </p>
      </div>
    );
  }

  const amount = safeNumber(subscription?.amount, 0);
  const creditsUsed = safeNumber(subscription?.credits_used_this_month, 0);
  const creditCost = creditsUsed * 0.003;
  const hasUsage = isHosted && creditsUsed > 0;

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-medium text-white/50 mb-4">Cost Breakdown — This Month</h3>
      <div className="space-y-3">
        <CostRow label="Software subscription" value={formatCostShort(amount)} />
        {hasUsage && (
          <>
            <CostRow
              label={`Credit usage (${creditsUsed.toLocaleString()} credits)`}
              value={formatCostShort(creditCost, 2)}
            />
            <CostRow label="Extra credit purchases" value={formatCostShort(0)} />
          </>
        )}
        <div className="border-t border-white/[0.06] pt-3 flex justify-between">
          <span className="text-sm font-semibold text-white">Total</span>
          <span className="text-sm font-semibold text-white">
            {formatCostShort(hasUsage ? amount + creditCost : amount)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CostRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}

function AdvancedSection({ subscription }) {
  const provider = subscription?.provider || 'Creem';
  const customerId = subscription?.creem_customer_id;
  const subId = subscription?.creem_subscription_id;
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-medium text-white/50 mb-4">Advanced</h3>
      <div className="space-y-2 text-xs text-white/55">
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/40">Billing provider</span>
          <span className="text-white/70">{String(provider)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/40">Creem customer ID</span>
          <span className="text-white/70 font-mono text-[11px] break-all text-right">{customerId || '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/40">Creem subscription ID</span>
          <span className="text-white/70 font-mono text-[11px] break-all text-right">{subId || '—'}</span>
        </div>
        <p className="text-[11px] text-white/35 mt-3">
          前端不会展示或存储完整卡信息，也不会在此页面伪造已付费状态。
        </p>
      </div>
    </div>
  );
}