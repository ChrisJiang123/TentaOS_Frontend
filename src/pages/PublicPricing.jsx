// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useSEO from '@/lib/useSEO';
import { cn } from '@/lib/utils';
import PricingPageShell from '@/components/pricing/PricingPageShell';
import BillingStatusPanel from '@/components/pricing/BillingStatusPanel';
import TentaOSProCard from '@/components/pricing/TentaOSProCard';
import AiWrapperDisclaimer from '@/components/pricing/AiWrapperDisclaimer';
import PricingLegalNotice from '@/components/pricing/PricingLegalNotice';
import { FREE_PLAN, CREDIT_PACKS } from '@/lib/billingProducts';
import { redirectToCheckout, startCreemCheckout } from '@/lib/billingCheckout';
import { fetchBillingMe } from '@/lib/billingAccountApi';
export default function PublicPricing() {
  useSEO({
    title: 'Pricing — TentaOS',
    description: 'TentaOS pricing: Free/Beta and Pro. Payments via Creem.',
    keywords: 'TentaOS pricing, Pro plan, Creem checkout',
  });

  const [checkoutError, setCheckoutError] = useState('');
  const [packLoading, setPackLoading] = useState(null);

  const billing = useQuery({
    queryKey: ['billing-me', 'public-pricing-checkout'],
    queryFn: () => fetchBillingMe({ timeoutMs: 8000 }),
    retry: 0,
    staleTime: 60_000,
  });
  const checkoutReady = !billing.isLoading && !billing.isError && billing.data != null;

  async function buyPack(productKey) {
    if (!checkoutReady) {
      setCheckoutError('Billing is not connected yet. Credit pack checkout requires a configured Creem endpoint.');
      return;
    }
    setCheckoutError('');
    setPackLoading(productKey);
    try {
      const { checkoutUrl } = await startCreemCheckout({ product: productKey });
      redirectToCheckout(checkoutUrl);
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : String(e));
    } finally {
      setPackLoading(null);
    }
  }

  return (
    <PricingPageShell data-testid="pricing-page">
      <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">Pricing</p>
      <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
        Simple, transparent pricing
      </h1>
      <p className="text-sm text-white/45 mb-8 max-w-2xl">
        Choose Free/Beta to evaluate TentaOS, or upgrade to Pro for production workflows. Payments are processed
        by Creem — we never store full card details in the browser.
      </p>

      <BillingStatusPanel className="mb-8" />

      {checkoutError && (
        <div
          className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5"
          data-testid="checkout-error"
        >
          <p className="text-sm text-red-300/90">Unable to start checkout: {checkoutError}</p>
          <p className="text-xs text-white/40 mt-2">
            If billing is not deployed yet, the backend must expose POST /api/billing/creem/checkout.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white">{FREE_PLAN.name}</h2>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">{FREE_PLAN.priceLabel}</span>
            <span className="text-xs text-white/35">{FREE_PLAN.periodLabel}</span>
          </div>
          <p className="text-sm text-white/45 mt-2">{FREE_PLAN.description}</p>
          <ul className="mt-5 space-y-2 text-sm text-white/65 flex-1">
            {FREE_PLAN.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center justify-center h-10 rounded-xl text-sm font-medium bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/[0.08]"
          >
            Join Beta
          </Link>
        </div>

        <div className="lg:col-span-2">
          <TentaOSProCard onCheckoutError={setCheckoutError} />
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-1">Credit packs (add-on)</h2>
        <p className="text-xs text-white/40 mb-4">One-time purchases via the same Creem checkout flow.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CREDIT_PACKS.map((p) => (
            <div key={p.key} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-sm text-white/80">{p.priceLabel}</p>
              </div>
              <p className="text-xs text-white/40 mt-1">{p.note}</p>
              <button
                type="button"
                onClick={() => buyPack(p.key)}
                disabled={packLoading === p.key || billing.isLoading || !checkoutReady}
                className={cn(
                  'mt-3 text-xs font-medium text-[#00E5FF]/90 hover:text-[#00E5FF] disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {packLoading === p.key
                  ? 'Redirecting…'
                  : billing.isLoading
                    ? 'Checking billing…'
                    : checkoutReady
                      ? 'Buy credits'
                      : 'Checkout unavailable'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-4 mb-4">
        <AiWrapperDisclaimer />
        <PricingLegalNotice />
      </div>
    </PricingPageShell>
  );
}
