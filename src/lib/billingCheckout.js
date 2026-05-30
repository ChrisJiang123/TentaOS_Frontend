// @ts-nocheck
import { createCreemCheckout } from '@/lib/billingAccountApi';

/**
 * Start Creem checkout via backend (POST /api/billing/creem/checkout).
 * API key stays server-side — frontend only receives checkout_url.
 */
export async function startCreemCheckout({
  product,
  quantity = 1,
  return_path = '/billing/success',
  cancel_path = '/billing/cancel',
} = {}) {
  const res = await createCreemCheckout({
    product,
    quantity,
    return_path,
    cancel_path,
  });
  const checkoutUrl = res?.checkout_url || res?.url || res?.checkoutUrl;
  if (!checkoutUrl) {
    throw new Error('Checkout URL was not returned by the server. Billing API may be unavailable.');
  }
  return { checkoutUrl: String(checkoutUrl), raw: res };
}

export function redirectToCheckout(checkoutUrl) {
  window.location.href = checkoutUrl;
}
