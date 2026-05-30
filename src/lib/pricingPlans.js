// @ts-nocheck
/**
 * Canonical SaaS pricing tiers — used when Engine GET /api/pricing is missing or malformed.
 * No fake traction metrics; CTAs are request-access until checkout is live.
 */

export const CANONICAL_PRICING_PLANS = [
  {
    id: 'early-access',
    name: 'Early Access',
    audience: 'Founders, design partners, and early reviewers',
    priceLabel: 'Request access',
    monthlyPrice: null,
    features: [
      'Phase 1 demo access with Cloudflare Engine',
      'Observable task pipeline & control plane',
      'Direct feedback channel with the team',
    ],
    usageLimits: 'Demo task quota · BYOK optional',
    cta: 'Join early access',
    ctaType: 'request',
    highlighted: true,
    checkoutStatus: 'early_access_request',
  },
  {
    id: 'builder',
    name: 'Builder',
    audience: 'Individual builders shipping AI workflows',
    priceLabel: 'To be announced',
    monthlyPrice: null,
    features: [
      'Higher task & pipeline limits',
      'Agents, models, and triggers registry',
      'Runtime debug & audit-friendly execution',
    ],
    usageLimits: 'Usage limits published at launch',
    cta: 'Request access',
    ctaType: 'request',
    highlighted: false,
    checkoutStatus: 'early_access_request',
  },
  {
    id: 'team',
    name: 'Team',
    audience: 'Small teams coordinating AI operations',
    priceLabel: 'To be announced',
    monthlyPrice: null,
    features: [
      'Shared workflows & team-ready control plane',
      'Approval gates & policy routing',
      'Priority onboarding support',
    ],
    usageLimits: 'Pooled usage · custom seats at launch',
    cta: 'Contact for onboarding',
    ctaType: 'contact',
    highlighted: false,
    checkoutStatus: 'early_access_request',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    audience: 'Organizations with compliance and deployment needs',
    priceLabel: 'Custom',
    monthlyPrice: null,
    features: [
      'Custom deployment & security review',
      'Dedicated support path',
      'SLA & procurement-friendly billing',
    ],
    usageLimits: 'Custom',
    cta: 'Contact for onboarding',
    ctaType: 'contact',
    highlighted: false,
    checkoutStatus: 'early_access_request',
  },
];

const CTA_BY_TYPE = {
  request: { label: 'Request access', href: '/contact' },
  contact: { label: 'Contact for onboarding', href: '/contact' },
  early_access: { label: 'Join early access', href: '/contact' },
};

function normalizeFeatureList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f) => {
      if (typeof f === 'string') return f;
      if (f && typeof f === 'object') return f.label || f.name || f.text || '';
      return '';
    })
    .filter(Boolean);
}

function normalizePlan(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? raw.plan_id ?? raw.slug ?? `plan-${index}`).toLowerCase();
  const name = raw.name ?? raw.display_name ?? raw.title;
  if (!name) return null;

  const features = normalizeFeatureList(raw.features ?? raw.includes);
  const checkoutStatus = raw.checkout_status ?? raw.checkoutStatus ?? 'early_access_request';
  const priceLabel =
    raw.price_label ??
    raw.priceLabel ??
    (raw.monthly_price != null ? `$${raw.monthly_price}/mo` : null) ??
    (raw.price_usd != null ? `$${raw.price_usd}/mo` : null) ??
    'Request access';

  const ctaType =
    checkoutStatus === 'live' && raw.product_key ? 'checkout' : raw.cta_type ?? 'request';

  const defaultCta =
    id === 'enterprise' || id === 'team'
      ? 'Contact for onboarding'
      : id === 'early-access'
        ? 'Join early access'
        : 'Request access';

  return {
    id,
    name: String(name),
    audience: raw.audience ?? raw.target_user ?? raw.tagline ?? raw.description ?? '—',
    priceLabel: String(priceLabel),
    monthlyPrice: typeof raw.monthly_price === 'number' ? raw.monthly_price : null,
    features: features.length ? features : ['Plan details from Engine'],
    usageLimits: raw.usage_limits ?? raw.limits ?? raw.usage ?? 'Per plan entitlement',
    cta: raw.cta ?? raw.cta_label ?? defaultCta,
    ctaType,
    productKey: raw.product_key ?? raw.productKey ?? null,
    highlighted: Boolean(raw.highlighted ?? raw.popular ?? id === 'early-access'),
    checkoutStatus,
  };
}

function isValidPlan(plan) {
  return plan && plan.id && plan.name && Array.isArray(plan.features) && plan.features.length > 0;
}

/**
 * Use Engine plans only when at least 3 valid plan objects are returned.
 * Never collapse to a single merged package.
 */
export function resolvePricingPlans(apiResult) {
  const candidates = [
    apiResult?.plans,
    apiResult?.pricing?.plans,
    apiResult?.data?.plans,
    apiResult?.list,
  ];

  for (const raw of candidates) {
    if (!Array.isArray(raw)) continue;
    const plans = raw.map(normalizePlan).filter(isValidPlan);
    if (plans.length >= 3) {
      return {
        plans,
        source: 'engine',
        checkoutStatus:
          apiResult?.checkout_status ??
          apiResult?.pricing?.checkout_status ??
          apiResult?.checkoutStatus ??
          null,
      };
    }
  }

  return {
    plans: CANONICAL_PRICING_PLANS,
    source: 'canonical',
    checkoutStatus: 'early_access_request',
  };
}

export function planCtaHref(plan) {
  if (plan?.ctaType === 'checkout' && plan?.productKey) return null;
  if (plan?.ctaType === 'contact') return '/contact';
  return '/contact';
}

export { CTA_BY_TYPE };
