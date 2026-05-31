// @ts-nocheck
/**
 * Canonical Phase 1 public pricing — used when GET /api/pricing fails or returns malformed data,
 * and as the display source of truth when Engine plans are merged by id.
 */

export const CANONICAL_PRICING_PLANS = [
  {
    id: 'early-access',
    name: 'Early Access',
    audience: 'Founders and design partners',
    priceLabel: '$0',
    monthlyPrice: 0,
    features: [
      'Phase 1 demo access',
      'Cloudflare Engine endpoint',
      'Feedback channel',
      'Dashboard task runs',
    ],
    cta: 'Start free',
    ctaType: 'start',
    highlighted: true,
    checkoutStatus: 'early_access_request',
  },
  {
    id: 'builder',
    name: 'Builder',
    audience: 'Individual builders',
    priceLabel: '$19',
    monthlyPrice: 19,
    features: [
      'Task runs',
      'Agent registry',
      'Cortex Pipeline Studio',
      'Model routing dashboard',
      'Usage tracking',
    ],
    cta: 'Join Builder',
    ctaType: 'request',
    highlighted: false,
    checkoutStatus: 'early_access_request',
  },
  {
    id: 'team',
    name: 'Team',
    audience: 'Small teams',
    priceLabel: '$49',
    monthlyPrice: 49,
    features: [
      'Shared workflows',
      'Team-ready control plane',
      'Approvals workflow',
      'Trigger builder',
      'Priority feedback',
    ],
    cta: 'Join Team',
    ctaType: 'request',
    highlighted: false,
    checkoutStatus: 'early_access_request',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    audience: 'Organizations with compliance needs',
    priceLabel: 'Contact',
    monthlyPrice: null,
    features: [
      'Custom deployment review',
      'Security workflow planning',
      'Dedicated support path',
      'Compliance-oriented controls',
    ],
    cta: 'Contact for onboarding',
    ctaType: 'contact',
    highlighted: false,
    checkoutStatus: 'early_access_request',
  },
];

const CANONICAL_BY_ID = Object.fromEntries(CANONICAL_PRICING_PLANS.map((p) => [p.id, p]));

const CTA_BY_TYPE = {
  start: { label: 'Start free', href: '/Dashboard' },
  request: { label: 'Request access', href: '/contact' },
  contact: { label: 'Contact for onboarding', href: '/contact' },
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
  const monthlyPrice =
    typeof raw.monthly_price === 'number'
      ? raw.monthly_price
      : typeof raw.price_usd === 'number'
        ? raw.price_usd
        : null;

  const priceLabel =
    raw.price_label ??
    raw.priceLabel ??
    (monthlyPrice != null ? `$${monthlyPrice}` : null) ??
    'Contact';

  const ctaType =
    checkoutStatus === 'live' && raw.product_key ? 'checkout' : raw.cta_type ?? 'request';

  const plan = {
    id,
    name: String(name),
    audience: raw.audience ?? raw.target_user ?? raw.tagline ?? raw.description ?? '—',
    priceLabel: String(priceLabel),
    monthlyPrice,
    features: features.length ? features : ['Plan details from Engine'],
    cta: raw.cta ?? raw.cta_label ?? CTA_BY_TYPE[ctaType]?.label ?? 'Request access',
    ctaType,
    productKey: raw.product_key ?? raw.productKey ?? null,
    highlighted: Boolean(raw.highlighted ?? raw.popular ?? id === 'early-access'),
    checkoutStatus,
  };

  return mergeWithCanonical(plan);
}

/** Phase 1 public copy wins; Engine may supply checkout metadata only. */
function mergeWithCanonical(plan) {
  const canonical = CANONICAL_BY_ID[plan.id];
  if (!canonical) return plan;
  return {
    ...plan,
    name: canonical.name,
    audience: canonical.audience,
    priceLabel: canonical.priceLabel,
    monthlyPrice: canonical.monthlyPrice,
    features: canonical.features,
    cta: canonical.cta,
    ctaType: plan.ctaType === 'checkout' && plan.productKey ? 'checkout' : canonical.ctaType,
    highlighted: canonical.highlighted,
  };
}

function isValidPlan(plan) {
  return plan && plan.id && plan.name && Array.isArray(plan.features) && plan.features.length > 0;
}

/**
 * Use Engine plans only when at least 3 valid plan objects are returned.
 * Display copy is merged with canonical tiers by plan id.
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
  if (plan?.ctaType === 'start') return '/Dashboard';
  if (plan?.ctaType === 'contact') return '/contact';
  return '/contact';
}

export function formatPlanPrice(plan) {
  if (!plan) return '—';
  if (plan.id === 'enterprise' || plan.priceLabel === 'Contact') return 'Contact';
  if (plan.monthlyPrice === 0) return '$0';
  if (typeof plan.monthlyPrice === 'number') return `$${plan.monthlyPrice}`;
  return plan.priceLabel;
}

export function planShowsMonthlySuffix(plan) {
  return plan && plan.id !== 'enterprise' && typeof plan.monthlyPrice === 'number';
}

export { CTA_BY_TYPE };
