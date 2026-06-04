// @ts-nocheck
/** Display + checkout product keys (backend maps key → Creem product). No secrets here. */

export const BILLING_PRODUCT_KEYS = {
  PRO: 'plan_pro',
  FOUNDER: 'plan_founder',
  CREDITS_SMALL: 'credits_small',
  CREDITS_MEDIUM: 'credits_medium',
  CREDITS_LARGE: 'credits_large',
};

export const TENTAOS_PRO_PLAN = {
  productKey: BILLING_PRODUCT_KEYS.PRO,
  name: 'TentaOS Pro',
  priceLabel: '$49',
  priceUsd: 49,
  periodLabel: 'per month',
  description: 'For professionals running observable AI workflows with approval gates and audit-friendly execution.',
  features: [
    'Higher usage limits for Engine tasks',
    'Pipeline monitoring & runtime debug visibility',
    'Priority email support (support@tentaos.com)',
    'Credit packs available as add-ons',
  ],
};

export const FREE_PLAN = {
  name: 'Free / Beta',
  priceLabel: '$0',
  periodLabel: 'during beta',
  description: 'Evaluate TentaOS with core dashboard and BYOK support.',
  features: [
    'Core dashboard & task submission',
    'WebSocket pipeline event visibility',
    'Bring your own API keys (BYOK)',
  ],
};

export const CREDIT_PACKS = [
  { key: BILLING_PRODUCT_KEYS.CREDITS_SMALL, name: 'Credit Pack — Small', priceLabel: '$10', note: 'One-time purchase' },
  { key: BILLING_PRODUCT_KEYS.CREDITS_MEDIUM, name: 'Credit Pack — Medium', priceLabel: '$25', note: 'One-time purchase' },
  { key: BILLING_PRODUCT_KEYS.CREDITS_LARGE, name: 'Credit Pack — Large', priceLabel: '$50', note: 'One-time purchase' },
];
