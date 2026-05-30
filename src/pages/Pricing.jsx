// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useSEO from '@/lib/useSEO';
import AiWrapperDisclaimer from '@/components/pricing/AiWrapperDisclaimer';
import PricingLegalNotice from '@/components/pricing/PricingLegalNotice';
import PlanComparisonGrid from '@/components/pricing/PlanComparisonGrid';
import { fetchPricing } from '@/lib/controlPlaneApi';
import { fetchBillingMe } from '@/lib/billingAccountApi';
import { resolvePricingPlans } from '@/lib/pricingPlans';
import { redirectToCheckout, startCreemCheckout } from '@/lib/billingCheckout';

export default function Pricing() {
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const pricingQuery = useQuery({
    queryKey: ['engine-pricing'],
    queryFn: fetchPricing,
    retry: 0,
    staleTime: 60_000,
  });

  const billingQuery = useQuery({
    queryKey: ['billing-me', 'pricing-checkout-gate'],
    queryFn: () => fetchBillingMe({ timeoutMs: 8000 }),
    retry: 0,
    staleTime: 60_000,
  });

  const { plans, source, checkoutStatus } = useMemo(
    () => resolvePricingPlans(pricingQuery.data ?? {}),
    [pricingQuery.data],
  );

  const checkoutReady =
    !billingQuery.isLoading &&
    !billingQuery.isError &&
    billingQuery.data != null &&
    checkoutStatus === 'live';

  useSEO({
    title: 'Pricing — TentaOS',
    description: 'Compare Early Access, Builder, Team, and Enterprise plans for TentaOS.',
    keywords: 'TentaOS pricing, early access, Builder, Team, Enterprise',
  });

  async function handleCheckoutPlan(plan) {
    if (!plan?.productKey || !checkoutReady) {
      setCheckoutError('Checkout is not live yet. Use Request access to join the early access cohort.');
      return;
    }
    setCheckoutError('');
    setCheckoutLoading(plan.id);
    try {
      const { checkoutUrl } = await startCreemCheckout({ product: plan.productKey });
      redirectToCheckout(checkoutUrl);
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : String(e));
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div data-testid="pricing-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Pricing</h1>
            <p className="text-sm text-white/40 mt-1 max-w-2xl">
              Compare plans for observable AI workflows. Early access is onboarding-only — we do not show fake
              checkout or usage metrics.
            </p>
            {source === 'engine' && !pricingQuery.isLoading && (
              <p className="text-[11px] text-emerald-400/70 mt-1">Plan copy loaded from Engine GET /api/pricing</p>
            )}
            {source === 'canonical' && !pricingQuery.isLoading && (
              <p className="text-[11px] text-white/30 mt-1">Using canonical plan catalog (Engine returned fewer than 3 valid plans).</p>
            )}
          </div>
          <Link
            to="/pricing"
            className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] font-medium shrink-0"
          >
            Open public pricing →
          </Link>
        </div>

        {checkoutError && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300/90">
            {checkoutError}
          </div>
        )}

        <PlanComparisonGrid
          plans={plans}
          checkoutReady={checkoutReady && !checkoutLoading}
          onCheckoutPlan={handleCheckoutPlan}
        />

        <p className="text-xs text-white/35 mt-6 text-center max-w-2xl mx-auto">
          Payments will be processed by Creem when checkout goes live for approved accounts. Until then, all
          plan CTAs route to onboarding — no broken payment links.
        </p>

        <div className="space-y-4 mt-10">
          <AiWrapperDisclaimer />
          <PricingLegalNotice />
        </div>
      </div>
    </div>
  );
}
