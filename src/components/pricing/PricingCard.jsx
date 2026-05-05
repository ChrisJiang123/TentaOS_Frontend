import React from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const tierColors = {
  free: 'border-white/10 hover:border-white/20',
  starter: 'border-emerald-500/40 hover:border-emerald-400/60',
  pro: 'border-purple-500/40 hover:border-purple-400/60',
  team: 'border-blue-500/40 hover:border-blue-400/60',
};

const ctaColors = {
  free: 'bg-white/10 hover:bg-white/20 text-white',
  starter: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  pro: 'bg-purple-600 hover:bg-purple-500 text-white',
  team: 'bg-blue-600 hover:bg-blue-500 text-white',
};

const badgeColors = {
  starter: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pro: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export default function PricingCard({ plan, billingCycle = 'monthly', isPopular, onSelect, loading }) {
  const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const displayPrice = billingCycle === 'yearly' && price > 0 ? Math.round(price / 12) : price;
  const isYearly = billingCycle === 'yearly';

  return (
    <div className={cn(
      "relative bg-[#0F1117] rounded-2xl border-2 p-6 lg:p-8 transition-all duration-300 hover:-translate-y-1 flex flex-col",
      tierColors[plan.id]
    )}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-purple-600 text-white border-0 text-xs px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      {plan.badge && !isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className={cn("border text-xs px-3 py-1", badgeColors[plan.id] || 'bg-blue-500/10 text-blue-400 border-blue-500/20')}>
            {plan.badge}
          </Badge>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
        <p className="text-sm text-white/50">{plan.tagline}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">${displayPrice}</span>
          {price > 0 && <span className="text-white/40 text-sm">/mo</span>}
        </div>
        {isYearly && price > 0 && (
          <p className="text-xs text-emerald-400 mt-1">
            ${price}/yr — save ${plan.monthlyPrice * 12 - price}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-3 mb-8">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            {f.included ? (
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-white/20 mt-0.5 flex-shrink-0" />
            )}
            <span className={cn("text-sm", f.included ? "text-white/70" : "text-white/30")}>
              {f.label}
            </span>
          </div>
        ))}
      </div>

      <Button
        className={cn("w-full h-11 font-medium rounded-xl", ctaColors[plan.id])}
        onClick={() => onSelect(plan.id)}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
        ) : (
          plan.cta
        )}
      </Button>
    </div>
  );
}