// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { fetchBillingMe, fetchUserMe } from '@/lib/billingAccountApi';
import { isEngineApiSkippedError } from '@/lib/engineApiPaths';

export default function BillingStatusPanel({ className = '', showUpgradeLink = true }) {
  const me = useQuery({
    queryKey: ['users-me', 'billing-status'],
    queryFn: () => fetchUserMe({ timeoutMs: 10_000 }),
    retry: 0,
    staleTime: 30_000,
  });

  const billing = useQuery({
    queryKey: ['billing-me', 'billing-status'],
    queryFn: () => fetchBillingMe({ timeoutMs: 10_000 }),
    retry: 0,
    staleTime: 30_000,
  });

  const loading = me.isLoading || billing.isLoading;
  const skipped =
    (me.error && isEngineApiSkippedError(me.error)) ||
    (billing.error && isEngineApiSkippedError(billing.error));
  const unavailable = me.isError || billing.isError;

  const plan = String(billing.data?.plan ?? billing.data?.tier ?? 'free');
  const status = String(billing.data?.status ?? (unavailable && !skipped ? 'unknown' : 'not_connected'));
  const credits = billing.data?.credits_balance;
  const email = me.data?.email || me.data?.name || null;

  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 ${className}`}
      data-testid="billing-status-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider">Account & Billing</p>
          <p className="text-[11px] text-white/30 mt-0.5">Source: GET /api/billing/me</p>
        </div>
        {showUpgradeLink && (
          <Link
            to="/pricing"
            className="text-xs text-[#00E5FF]/90 hover:text-[#00E5FF] font-medium"
          >
            View pricing →
          </Link>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading billing status…
        </div>
      )}

      {!loading && skipped && (
        <p className="text-sm text-white/50">
          Billing API is not connected in this environment. Status below is not available — no paid state is
          shown until the backend confirms via <code className="text-white/40">/api/billing/me</code>.
        </p>
      )}

      {!loading && unavailable && !skipped && (
        <p className="text-sm text-amber-300/90">
          Unable to load billing status. We do not display a fake “paid” state.
          {billing.error instanceof Error ? ` (${billing.error.message})` : ''}
        </p>
      )}

      {!loading && !unavailable && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-white/35 text-xs">Account</dt>
            <dd className="text-white/85 mt-0.5">{email || '—'}</dd>
          </div>
          <div>
            <dt className="text-white/35 text-xs">Plan</dt>
            <dd className="text-white/85 mt-0.5 capitalize">{plan}</dd>
          </div>
          <div>
            <dt className="text-white/35 text-xs">Status</dt>
            <dd className="text-white/85 mt-0.5">{status}</dd>
          </div>
          <div>
            <dt className="text-white/35 text-xs">Credits balance</dt>
            <dd className="text-white/85 mt-0.5">
              {credits == null ? '—' : Number(credits).toLocaleString()}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
