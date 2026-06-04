// @ts-nocheck
import engineClient from '@/lib/engineClient';

function asObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

function unwrap(v) {
  const o = asObj(v);
  if (o.data && typeof o.data === 'object') return o.data;
  return o;
}

export async function fetchUserMe({ timeoutMs = 10_000 } = {}) {
  const raw = await engineClient.request('/api/users/me', { timeoutMs });
  return unwrap(raw);
}

export async function fetchBillingMe({ timeoutMs = 10_000 } = {}) {
  const raw = await engineClient.request('/api/billing/me', { timeoutMs });
  return unwrap(raw);
}

/**
 * Create a Creem checkout session.
 *
 * We intentionally keep the payload minimal and forward "product" as a stable identifier.
 * Backend should map product -> Creem product/price/subscription mode.
 */
export async function createCreemCheckout({ product, quantity = 1, return_path, cancel_path } = {}) {
  const payload = {
    product,
    quantity,
    ...(return_path ? { return_path } : {}),
    ...(cancel_path ? { cancel_path } : {}),
  };
  const raw = await engineClient.request('/api/billing/creem/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return unwrap(raw);
}

