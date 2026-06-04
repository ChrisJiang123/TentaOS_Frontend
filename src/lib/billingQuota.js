// @ts-nocheck
import { fetchBillingMe } from './billingAccountApi.js';

/**
 * Check whether user can start a new task (Phase 20).
 * @returns {{ allowed: boolean, reason?: string, billing?: object }}
 */
export async function checkTaskQuota() {
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
        reason: '本月额度已用尽，请升级套餐或购买额度',
        billing,
      };
    }

    if (Number.isFinite(balance) && balance <= 0 && limit > 0) {
      return {
        allowed: false,
        reason: '额度不足，请前往 Usage 升级或充值',
        billing,
      };
    }

    if (limit > 0 && used >= limit) {
      return {
        allowed: false,
        reason: '已达到本月任务额度上限',
        billing,
      };
    }

    return { allowed: true, billing };
  } catch {
    return { allowed: true, billing: null };
  }
}
