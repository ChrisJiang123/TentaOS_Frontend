import React, { useState, useEffect } from 'react';
import { Key, Cloud, Zap, Users } from 'lucide-react';
import PricingCard from '../components/pricing/PricingCard';
import { toast } from '@/components/ui/use-toast';
import useSEO from '../lib/useSEO';

const plans = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Get started with TentaOS',
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: 'Start Free',
    features: [
      { label: 'Basic Terminal + Web access', included: true },
      { label: 'Limited workflows (3 active)', included: true },
      { label: 'Small hosted trial credits (500)', included: true },
      { label: 'BYOK support', included: true },
      { label: 'Advanced workflows', included: false },
      { label: 'Replay / Logs / Templates', included: false },
      { label: 'Team collaboration', included: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For individuals getting started',
    monthlyPrice: 19,
    yearlyPrice: 190,
    paddlePlan: 'starter',
    cta: 'Subscribe Now',
    features: [
      { label: 'Advanced workflows (unlimited)', included: true },
      { label: 'Replay / Logs / Templates', included: true },
      { label: 'Integrations & plugins', included: true },
      { label: 'BYOK support', included: true },
      { label: 'Priority support', included: true },
      { label: 'Team collaboration', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Full power for professionals',
    monthlyPrice: 49,
    yearlyPrice: 490,
    paddlePlan: 'pro',
    badge: 'Most Popular',
    cta: 'Subscribe Now',
    features: [
      { label: 'Everything in Starter', included: true },
      { label: '10,000 credits / month', included: true },
      { label: 'Extra credit packs available', included: true },
      { label: 'No API setup required', included: true },
      { label: 'Usage analytics dashboard', included: true },
      { label: 'Team collaboration', included: false },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    tagline: 'For teams & organizations',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    paddlePlan: 'team',
    cta: 'Subscribe Now',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: '5 seats included', included: true },
      { label: 'Shared workspace', included: true },
      { label: 'Approvals / Admin roles / Audit logs', included: true },
      { label: '100,000 credits / month', included: true },
      { label: 'Priority support & onboarding', included: true },
    ],
  },
];

const iconMap = {
  free: Zap,
  starter: Key,
  pro: Cloud,
  team: Users,
};

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(null);

  useSEO({
    title: 'TentaOS Pricing — Free, Starter, Pro & Team Plans',
    description: 'Simple, transparent pricing for TentaOS. Choose the plan that fits your needs - from free tier to enterprise solutions.',
    keywords: 'TentaOS pricing, AI agent pricing, AI workflow plans, BYOK pricing, AI SaaS pricing, TentaOS free plan, AI team plan',
  });

  useEffect(() => {
    // Load Paddle.js
    if (!document.getElementById('paddle-js')) {
      const script = document.createElement('script');
      script.id = 'paddle-js';
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.onload = () => {
        // Will init when needed
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleSelect = async (planId) => {
    if (planId === 'free') {
      toast({ title: 'You are on the Free plan', description: 'Enjoy your free trial credits!' });
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan?.paddlePlan) return;

    setLoading(planId);
    try {
      // base44 Paddle checkout 已移除：保留页面展示，不触发任何后端调用
      toast({ title: '本地模式', description: '计费/订阅功能未接入 Engine，暂不可用。' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div data-testid="pricing-page" className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more power.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Yearly <span className="text-emerald-400 ml-1">Save ~17%</span>
          </button>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              isPopular={plan.id === 'pro'}
              onSelect={handleSelect}
              loading={loading === plan.id}
            />
          ))}
        </div>

        {/* FAQ / Bottom section */}
        <div className="mt-16 text-center">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <FaqItem
              q="What is BYOK?"
              a="BYOK (Bring Your Own Key) means you provide your own API keys from providers like OpenAI, Anthropic, or Google. You only pay for the TentaOS software subscription — all AI costs go directly to your provider account."
            />
            <FaqItem
              q="Can I switch between BYOK and Hosted?"
              a="Yes! You can switch billing modes once every 30 days from your Billing dashboard. Switching to Hosted gives you an initial credit allocation."
            />
            <FaqItem
              q="What happens when I run out of credits?"
              a="Your hosted AI tasks will pause until you purchase more credits or wait for your next monthly allocation. BYOK tasks are unaffected."
            />
            <FaqItem
              q="Can I upgrade or downgrade anytime?"
              a="Absolutely. Plan changes take effect immediately. Upgrades are prorated, and downgrades apply at the end of the current billing cycle."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 cursor-pointer transition-colors hover:bg-white/[0.05]"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">{q}</span>
        <span className="text-white/30 text-lg">{open ? '−' : '+'}</span>
      </div>
      {open && <p className="mt-3 text-sm text-white/50 leading-relaxed">{a}</p>}
    </div>
  );
}