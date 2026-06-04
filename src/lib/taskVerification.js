// @ts-nocheck
/**
 * Display rules for verification-backed completion (Phase 6).
 * UI must follow backend verification.result — never invent pass/fail.
 */

export function stepVerificationLabel(step) {
  const v = step?.verification;
  const result = v?.result;
  if (result === 'pass') {
    return { icon: 'pass', text: v?.detail ? `✓ ${v.detail}` : '✓ 验证通过' };
  }
  if (result === 'fail') {
    return { icon: 'fail', text: v?.detail ? `✗ ${v.detail}` : '✗ 验证失败' };
  }
  if (step?.status === 'passed' || step?.status === 'completed') {
    return { icon: 'pending', text: '待验证' };
  }
  if (step?.status === 'failed') {
    return { icon: 'fail', text: '步骤失败' };
  }
  return null;
}

export function hasVerificationFailure(pipeline) {
  const steps = pipeline?.steps || [];
  if (steps.some((s) => s.verification?.result === 'fail' || s.status === 'failed')) {
    return true;
  }
  const checks = pipeline?.verification_summary?.checks || [];
  return checks.some((c) => c.result === 'fail');
}

/** Task header badge — may differ from raw API status when checks fail. */
export function getDisplayTaskStatus(pipeline) {
  if (!pipeline) return 'queued';
  const raw = pipeline.status;
  if (['failed', 'cancelled'].includes(raw)) return raw;
  if (hasVerificationFailure(pipeline)) return 'failed';
  if (raw === 'completed') {
    const pending = (pipeline.steps || []).some(
      (s) => (s.status === 'passed' || s.status === 'completed') && !s.verification?.result,
    );
    if (pending) return 'completed_pending';
    return 'completed';
  }
  return raw;
}

export function canShowSuccessCompletion(pipeline) {
  return getDisplayTaskStatus(pipeline) === 'completed';
}
