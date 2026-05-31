// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useSEO from '@/lib/useSEO';
import PricingPageShell from '@/components/pricing/PricingPageShell';
import PlanComparisonGrid from '@/components/pricing/PlanComparisonGrid';
import AiWrapperDisclaimer from '@/components/pricing/AiWrapperDisclaimer';
import PricingLegalNotice from '@/components/pricing/PricingLegalNotice';
import { fetchPricing } from '@/lib/controlPlaneApi';
import { fetchBillingMe } from '@/lib/billingAccountApi';
import { resolvePricingPlans } from '@/lib/pricingPlans';
import { redirectToCheckout, startCreemCheckout } from '@/lib/billingCheckout';

export default function PublicPricing() {
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const pricingQuery = useQuery({
    queryKey: ['engine-pricing', 'public'],
    queryFn: fetchPricing,
    retry: 0,
    staleTime: 60_000,
  });

  const billingQuery = useQuery({
    queryKey: ['billing-me', 'public-pricing-checkout'],
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
    <PricingPageShell
      data-testid="pricing-page"
      backHref="/Dashboard"
      backLabel="← Back to app"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/35 mb-2">Pricing</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
            Plans for every stage
          </h1>
          <p className="text-sm text-white/45 max-w-2xl">
            Phase 1 public pricing for TentaOS — compare Early Access, Builder, Team, and Enterprise. Checkout
            routes to onboarding until Creem is live for approved accounts.
          </p>
          {source === 'engine' && !pricingQuery.isLoading && (
            <p className="text-[11px] text-emerald-400/70 mt-2">Plans loaded from Engine GET /api/pricing</p>
          )}
        </div>
        <Link
          to="/Dashboard"
          className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] font-medium shrink-0"
        >
          Back to app →
        </Link>
      </div>

      {checkoutError && (
        <div
          className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5"
          data-testid="checkout-error"
        >
          <p className="text-sm text-red-300/90">{checkoutError}</p>
        </div>
      )}

      <PlanComparisonGrid
        plans={plans}
        checkoutReady={checkoutReady && !checkoutLoading}
        onCheckoutPlan={handleCheckoutPlan}
      />

      <p className="text-xs text-white/35 mt-8 text-center max-w-2xl mx-auto">
        Payments will be processed by Creem when checkout goes live for approved accounts. CTAs route to onboarding
        until then.
      </p>

      <div className="space-y-4 mt-10">
        <AiWrapperDisclaimer />
        <PricingLegalNotice />
      </div>
    </PricingPageShell>
  );
}
