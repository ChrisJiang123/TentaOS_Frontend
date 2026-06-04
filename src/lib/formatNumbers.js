// @ts-nocheck
/** Safe numeric formatting for Engine task / pipeline UI. */

export function formatNumber(value, digits = 2, fallback = '—') {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : fallback;
}

export function formatMs(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(0)} ms` : '—';
}

export function formatCost(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(4)}` : '$0.0000';
}

export function formatCostShort(value, digits = 2) {
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(digits)}` : '—';
}

export function formatDurationSeconds(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return '—';
  return `${(n / 1000).toFixed(1)}s`;
}

export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
