// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import useSEO from '@/lib/useSEO';
import BillingStatusPanel from '@/components/pricing/BillingStatusPanel';
import TentaOSProCard from '@/components/pricing/TentaOSProCard';
import AiWrapperDisclaimer from '@/components/pricing/AiWrapperDisclaimer';
import PricingLegalNotice from '@/components/pricing/PricingLegalNotice';
import { FREE_PLAN } from '@/lib/billingProducts';

export default function Pricing() {
  const [checkoutError, setCheckoutError] = useState('');

  useSEO({
    title: 'Pricing — TentaOS',
    description: 'Upgrade to TentaOS Pro. Checkout via Creem.',
    keywords: 'TentaOS pricing, Pro subscription',
  });

  return (
    <div data-testid="pricing-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Pricing</h1>
            <p className="text-sm text-white/40 mt-1">
              Upgrade to Pro or view the public pricing page for credit packs.
            </p>
          </div>
          <Link
            to="/pricing"
            className="text-sm text-[#00E5FF]/90 hover:text-[#00E5FF] font-medium"
          >
            Open public pricing →
          </Link>
        </div>

        <BillingStatusPanel className="mb-6" showUpgradeLink={false} />

        {checkoutError && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300/90">
            {checkoutError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="text-base font-semibold text-white">{FREE_PLAN.name}</h2>
            <p className="text-2xl font-bold text-white mt-2">{FREE_PLAN.priceLabel}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              {FREE_PLAN.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <TentaOSProCard onCheckoutError={setCheckoutError} compact />
        </div>

        <div className="space-y-4">
          <AiWrapperDisclaimer />
          <PricingLegalNotice />
        </div>
      </div>
    </div>
  );
}
