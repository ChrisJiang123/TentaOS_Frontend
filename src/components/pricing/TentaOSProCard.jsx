// @ts-nocheck
import React, { useState } from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { TENTAOS_PRO_PLAN } from '@/lib/billingProducts';
import { redirectToCheckout, startCreemCheckout } from '@/lib/billingCheckout';
import { fetchBillingMe } from '@/lib/billingAccountApi';

export default function TentaOSProCard({
  className = '',
  onCheckoutError,
  compact = false,
}) {
  const [loading, setLoading] = useState(false);
  const plan = TENTAOS_PRO_PLAN;

  const billing = useQuery({
    queryKey: ['billing-me', 'checkout-gate'],
    queryFn: () => fetchBillingMe({ timeoutMs: 8000 }),
    retry: 0,
    staleTime: 60_000,
  });

  const checkoutReady = !billing.isLoading && !billing.isError && billing.data != null;

  async function handleSubscribe() {
    if (!checkoutReady) {
      onCheckoutError?.('Billing is not connected yet. Checkout requires POST /api/billing/creem/checkout on the Engine.');
      return;
    }
    onCheckoutError?.('');
    setLoading(true);
    try {
      const { checkoutUrl } = await startCreemCheckout({ product: plan.productKey });
      redirectToCheckout(checkoutUrl);
    } catch (e) {
      onCheckoutError?.(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <article
      className={cn(
        'relative rounded-2xl border border-[#00E5FF]/35 bg-gradient-to-b from-[#00E5FF]/[0.08] to-transparent p-6 sm:p-8 flex flex-col shadow-[0_0_48px_rgba(0,229,255,0.08)]',
        className,
      )}
      data-testid="tentaos-pro-card"
    >
      <div className="absolute -top-3 left-6">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#00E5FF] text-[#06060B]">
          <Sparkles className="w-3 h-3" />
          Recommended
        </span>
      </div>

      <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4', compact ? 'mt-2' : 'mt-3')}>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white">{plan.name}</h2>
          <p className="text-sm text-white/50 mt-1 max-w-md">{plan.description}</p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className="flex items-baseline gap-1 sm:justify-end">
            <span className="text-4xl font-bold text-white">{plan.priceLabel}</span>
            <span className="text-sm text-white/40">USD</span>
          </div>
          <p className="text-xs text-white/35 mt-1">{plan.periodLabel}</p>
          <p className="text-[10px] text-white/25 mt-1">Billed via Creem · cancel per Refund Policy</p>
        </div>
      </div>

      <ul className="mt-6 space-y-2.5 text-sm text-white/70">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading || billing.isLoading || !checkoutReady}
        data-testid="subscribe-pro-button"
        className="mt-8 inline-flex items-center justify-center h-11 rounded-xl text-sm font-semibold bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto sm:min-w-[200px]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Redirecting to checkout…
          </>
        ) : billing.isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Checking billing…
          </>
        ) : checkoutReady ? (
          'Subscribe'
        ) : (
          'Checkout unavailable'
        )}
      </button>

      <p className="text-[10px] text-white/30 mt-3">
        {checkoutReady
          ? 'Clicking Subscribe calls our backend checkout API. You will be redirected to Creem to complete payment.'
          : 'Creem checkout is not configured on this Engine yet. No payment link is shown until /api/billing/me is available.'}
      </p>
    </article>
  );
}
