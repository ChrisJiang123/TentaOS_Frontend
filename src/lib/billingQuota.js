// @ts-nocheck
import { fetchBillingMe } from './billingAccountApi.js';
import { tStatic, getAppLang } from '@/i18n/useStrings';

/**
 * Check whether user can start a new task (Phase 20).
 * @returns {{ allowed: boolean, reason?: string, billing?: object }}
 */
export async function checkTaskQuota() {
  const lang = getAppLang();
  try {
    const billing = await fetchBillingMe({ timeoutMs: 8000 });

    const limit = Number(
      billing?.monthly_credit_limit ??
        billing?.monthly_allowance ??
        billing?.credits_limit ??
        0,
    );
    const used = Number(billing?.credits_used_this_month ?? billing?.used_month ?? 0);
    const balance = Number(billing?.credits_balance ?? billing?.credits ?? billing?.balance ?? NaN);

    if (billing?.quota_exceeded || billing?.over_limit) {
      return {
        allowed: false,
        reason: tStatic('quotaMonthlyExhausted', lang),
        billing,
      };
    }

    if (Number.isFinite(balance) && balance <= 0 && limit > 0) {
      return {
        allowed: false,
        reason: tStatic('quotaInsufficient', lang),
        billing,
      };
    }

    if (limit > 0 && used >= limit) {
      return {
        allowed: false,
        reason: tStatic('quotaTaskLimit', lang),
        billing,
      };
    }

    return { allowed: true, billing };
  } catch {
    return { allowed: true, billing: null };
  }
}
