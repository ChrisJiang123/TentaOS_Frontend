// @ts-nocheck
/** Safe coercion for JSX — never render raw objects as React children. */

export const isPrimitive = (value) =>
  value == null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean';

export const safeText = (value, fallback = '—') => {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const joined = value.map((item) => safeText(item, '')).filter(Boolean).join(', ');
    return joined || fallback;
  }
  if (typeof value === 'object') {
    return (
      value.note ||
      value.description ||
      value.summary ||
      value.name ||
      value.id ||
      value.prompt ||
      value.status ||
      fallback
    );
  }
  return fallback;
};

export const safeArray = (value) => (Array.isArray(value) ? value : []);

export const keyValueRows = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: safeText(value),
  }));
};

/** Turn policy objects, string arrays, or plain strings into display rows. */
export const policyRows = (value) => {
  if (value == null) return [];
  if (typeof value === 'string') return [{ key: 'policy', value }];
  if (Array.isArray(value)) {
    return value.map((item, i) => ({
      key: `item_${i}`,
      value: safeText(item),
    }));
  }
  if (typeof value === 'object') return keyValueRows(value);
  return [{ key: 'value', value: safeText(value) }];
};

/** String list from routing/safety fields — arrays of strings or policy note arrays. */
export const safeStringList = (value) => {
  if (Array.isArray(value)) return value.map((item) => safeText(item)).filter((s) => s && s !== '—');
  if (value && typeof value === 'object') {
    const notes = safeArray(value.notes);
    if (notes.length) return notes.map((n) => safeText(n)).filter(Boolean);
    return policyRows(value).map((r) => `${r.key}: ${r.value}`);
  }
  if (typeof value === 'string' && value) return [value];
  return [];
};
