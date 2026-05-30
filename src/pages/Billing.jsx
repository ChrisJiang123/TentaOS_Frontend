// @ts-nocheck
import React, { useEffect, useMemo } from 'react';
import { Receipt, ArrowRight, Mail, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import CreditBalance from '../components/billing/CreditBalance';
import TransactionTable from '../components/billing/TransactionTable';
import { Button } from '@/components/ui/button';
import { fetchBillingMe } from '@/lib/billingAccountApi';
import { engineTaskStore } from '@/lib/engineTaskStore';
import { useEngineTasks } from '@/hooks/useEngineTasks';
import { isActiveEngineStatus } from '@/lib/engineTaskUtils';
import { formatCostShort, safeNumber } from '@/lib/formatNumbers';

function displayPlan(plan) {
  const p = String(plan || '').toLowerCase();
  if (!p || p === 'free' || p === 'local' || p === 'demo') return 'Early Access / Demo';
  if (p.includes('early')) return 'Early Access';
  return plan;
}

function displayBillingStatus(status, billingConnected) {
  if (!billingConnected) return 'Early access onboarding';
  const s = String(status || '').toLowerCase();
  if (s === 'active' || s === 'trialing') return 'Early access onboarding';
  if (s === 'unknown' || !s) return 'Early access onboarding';
  return status;
}

function displayCheckoutStatus(billing, billingConnected) {
  if (!billingConnected) return 'Request access';
  const raw = billing?.checkout_status ?? billing?.checkoutStatus;
  if (raw === 'live') return 'Live for approved accounts';
  if (raw === 'prepared') return 'Prepared for approved accounts';
  return 'Prepared for approved accounts / Request access';
}

export default function Billing() {
  const { tasks } = useEngineTasks();

  useEffect(() => {
    engineTaskStore.refreshList().catch(() => {});
  }, []);

  const billing = useQuery({
    queryKey: ['billing-me'],
    queryFn: () => fetchBillingMe({ timeoutMs: 12_000 }),
    retry: 0,
    staleTime: 30_000,
  });

  const billingData = billing.data && typeof billing.data === 'object' ? billing.data : null;
  const billingConnected = !billing.isLoading && !billing.isError && billingData != null;

  const subscription = useMemo(() => {
    const b = billingData || {};
    const ledger = Array.isArray(b.ledger) ? b.ledger : Array.isArray(b.transactions) ? b.transactions : [];
    return {
      plan: b.plan ?? b.tier ?? 'early_access',
      status: b.status ?? (billing.isError ? 'unknown' : 'onboarding'),
      provider: b.provider ?? 'Creem',
      credits_balance: b.credits_balance ?? b.credits ?? b.balance ?? null,
      monthly_credit_limit: b.monthly_allowance ?? b.monthly_credit_limit ?? b.monthly_credits ?? 0,
      credits_used_this_month: b.credits_used_this_month ?? b.used_month ?? 0,
      total_cost: b.total_cost ?? b.estimated_cost ?? b.cost_usd ?? null,
      ledger,
      creem_customer_id: b.creem_customer_id ?? b.customer_id ?? null,
      creem_subscription_id: b.creem_subscription_id ?? b.subscription_id ?? null,
      checkout_status: b.checkout_status ?? b.checkoutStatus ?? null,
    };
  }, [billingData, billing.isError]);

  const taskList = Array.isArray(tasks) ? tasks : [];
  const tasksRun = taskList.length;
  const activeTasks = taskList.filter((t) => isActiveEngineStatus(t?.status)).length;
  const estimatedCost =
    subscription.total_cost != null
      ? formatCostShort(subscription.total_cost)
      : billingConnected && subscription.credits_used_this_month > 0
        ? formatCostShort(subscription.credits_used_this_month * 0.003, 2)
        : '—';

  return (
    <div data-testid="billing-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Billing & Usage</h1>
            <p className="text-sm text-white/40">Account status and usage for your early access workspace</p>
          </div>
        </div>

        <div className="space-y-6">
          <AccountStatusCard
            subscription={subscription}
            billingConnected={billingConnected}
            billingLoading={billing.isLoading}
            billingError={billing.isError ? billing.error : null}
          />

          <UsageThisMonth
            tasksRun={tasksRun}
            activeTasks={activeTasks}
            estimatedCost={estimatedCost}
            tokenSavings="Not measured yet"
          />

          <div className="flex flex-wrap gap-3">
            <Link to="/contact">
              <Button className="bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90">
                Request onboarding
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="mailto:support@tentaos.com">
              <Button
                variant="outline"
                className="border-white/10 text-white/70 hover:text-white bg-transparent hover:bg-white/5"
              >
                <LifeBuoy className="w-4 h-4 mr-2" />
                Contact support
              </Button>
            </a>
            <Link to="/Pricing">
              <Button
                variant="outline"
                className="border-white/10 text-white/70 hover:text-white bg-transparent hover:bg-white/5"
              >
                View pricing
              </Button>
            </Link>
          </div>

          {billingConnected && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CreditBalance
                subscription={subscription}
                onBuyCredits={() => {
                  window.location.assign('/contact');
                }}
              />
              <ProviderDetails subscription={subscription} />
            </div>
          )}

          {!billingConnected && !billing.isLoading && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-sm text-white/45">
              <p className="font-medium text-white/70 mb-2">Early access — billing API not connected</p>
              <p>
                Subscription and payment state appear when the Engine exposes{' '}
                <code className="text-white/35">/api/billing/me</code>. We never imply a successful payment unless
                the backend confirms it.
              </p>
            </div>
          )}

          {billing.isError && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-amber-300/90 text-sm">
              Billing service unavailable — no fake paid state is shown.
              <div className="text-xs text-white/45 mt-2">
                {billing.error instanceof Error ? billing.error.message : String(billing.error)}
              </div>
            </div>
          )}

          {billingConnected && Array.isArray(subscription.ledger) && subscription.ledger.length > 0 && (
            <TransactionTable transactions={subscription.ledger} />
          )}
        </div>
      </div>
    </div>
  );
}

function AccountStatusCard({ subscription, billingConnected, billingLoading, billingError }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Account & billing status</p>

      {billingLoading && <p className="text-sm text-white/45">Loading billing status…</p>}

      {!billingLoading && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <StatusRow label="Current plan" value={displayPlan(subscription.plan)} />
          <StatusRow
            label="Billing status"
            value={displayBillingStatus(subscription.status, billingConnected)}
          />
          <StatusRow label="Payment provider" value={String(subscription.provider || 'Creem')} />
          <StatusRow
            label="Checkout status"
            value={displayCheckoutStatus(subscription, billingConnected)}
          />
        </dl>
      )}

      {billingError && !billingLoading && (
        <p className="text-xs text-white/35 mt-4 flex items-start gap-2">
          <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Using demo defaults until billing connects. No subscription success is shown without backend confirmation.
        </p>
      )}
    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div>
      <dt className="text-white/35 text-xs">{label}</dt>
      <dd className="text-white/85 mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function UsageThisMonth({ tasksRun, activeTasks, estimatedCost, tokenSavings }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h3 className="text-sm font-medium text-white/50 mb-4">Usage this month</h3>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <dt className="text-white/35 text-xs">Tasks run</dt>
          <dd className="text-white/85 mt-0.5 text-lg font-semibold">{tasksRun}</dd>
        </div>
        <div>
          <dt className="text-white/35 text-xs">Active tasks</dt>
          <dd className="text-white/85 mt-0.5 text-lg font-semibold">{activeTasks}</dd>
        </div>
        <div>
          <dt className="text-white/35 text-xs">Estimated cost</dt>
          <dd className="text-white/85 mt-0.5 text-lg font-semibold">{estimatedCost}</dd>
        </div>
        <div>
          <dt className="text-white/35 text-xs">Token savings</dt>
          <dd className="text-white/85 mt-0.5 text-lg font-semibold">{tokenSavings}</dd>
        </div>
      </dl>
      <p className="text-[11px] text-white/30 mt-4">
        Task counts from your Engine workspace. Cost appears when billing reports usage or total_cost.
      </p>
    </div>
  );
}

function ProviderDetails({ subscription }) {
  const credits = safeNumber(subscription?.credits_balance, null);
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-medium text-white/50 mb-4">Advanced</h3>
      <div className="space-y-2 text-xs text-white/55">
        {credits != null && (
          <div className="flex items-center justify-between gap-4 mb-3 pb-3 border-b border-white/[0.06]">
            <span className="text-white/40">Credit balance</span>
            <span className="text-white/70 font-medium">{credits.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/40">Billing provider</span>
          <span className="text-white/70">{String(subscription?.provider || 'Creem')}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/40">Creem customer ID</span>
          <span className="text-white/70 font-mono text-[11px] break-all text-right">
            {subscription?.creem_customer_id || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/40">Creem subscription ID</span>
          <span className="text-white/70 font-mono text-[11px] break-all text-right">
            {subscription?.creem_subscription_id || '—'}
          </span>
        </div>
        <p className="text-[11px] text-white/35 mt-3">
          Card details are not stored in the browser. Paid status requires backend confirmation via /api/billing/me.
        </p>
      </div>
    </div>
  );
}
