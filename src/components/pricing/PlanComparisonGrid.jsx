// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { planCtaHref, formatPlanPrice, planShowsMonthlySuffix } from '@/lib/pricingPlans';

const tierStyles = {
  'early-access': 'border-[#00E5FF]/35 bg-gradient-to-b from-[#00E5FF]/[0.06] to-transparent',
  builder: 'border-white/[0.08] bg-white/[0.02]',
  team: 'border-white/[0.08] bg-white/[0.02]',
  enterprise: 'border-white/[0.08] bg-white/[0.02]',
};

export default function PlanComparisonGrid({ plans, checkoutReady = false, onCheckoutPlan }) {
  const list = Array.isArray(plans) ? plans : [];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
      data-testid="plan-comparison-grid"
    >
      {list.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          checkoutReady={checkoutReady}
          onCheckout={() => onCheckoutPlan?.(plan)}
        />
      ))}
    </div>
  );
}

function PlanCard({ plan, checkoutReady, onCheckout }) {
  const highlighted = plan.highlighted;
  const style = tierStyles[plan.id] ?? tierStyles.builder;
  const canCheckout = plan.ctaType === 'checkout' && plan.productKey && checkoutReady;
  const href = planCtaHref(plan);

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-2xl border p-5 lg:p-6 min-h-[420px]',
        style,
        highlighted && 'shadow-[0_0_40px_rgba(0,229,255,0.08)]',
      )}
      data-testid={`pricing-plan-${plan.id}`}
    >
      {highlighted && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#00E5FF] text-[#06060B]">
          Current cohort
        </span>
      )}

      <header className="mb-4 pt-1">
        <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
        <p className="text-xs text-white/45 mt-1 leading-relaxed">{plan.audience}</p>
      </header>

      <div className="mb-4">
        <div className="flex items-baseline gap-1.5">
          <p className="text-3xl font-bold text-white">{formatPlanPrice(plan)}</p>
          {planShowsMonthlySuffix(plan) && (
            <span className="text-sm text-white/40">/ month</span>
          )}
        </div>
      </div>

      <ul className="flex-1 space-y-2 text-sm text-white/65 mb-4">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {canCheckout ? (
        <button
          type="button"
          onClick={onCheckout}
          className="mt-auto inline-flex items-center justify-center h-10 rounded-xl text-sm font-medium bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/90"
        >
          {plan.cta}
        </button>
      ) : (
        <Link
          to={href}
          className={cn(
            'mt-auto inline-flex items-center justify-center h-10 rounded-xl text-sm font-medium border transition-colors',
            highlighted
              ? 'bg-[#00E5FF] text-[#06060B] border-transparent hover:bg-[#00E5FF]/90'
              : 'border-white/[0.12] text-white/75 hover:bg-white/[0.04]',
          )}
        >
          {plan.cta}
        </Link>
      )}
    </article>
  );
}
