// @ts-nocheck
import engineClient from './engineClient.js';
import { readJson, writeJson, ACCOUNT_STORAGE_KEYS } from './accountStorage.js';

export const DEFAULT_PREFERENCE_RULES = [
  {
    id: 'require_tests_before_deploy',
    label: 'Run tests before deploy',
    enabled: true,
    kind: 'verification',
    expression: 'npm test',
  },
  {
    id: 'require_approval_for_prod',
    label: 'Require approval for production',
    enabled: true,
    kind: 'approval',
    risk: 'high',
  },
  {
    id: 'preferred_model',
    label: 'Preferred model',
    enabled: false,
    kind: 'model',
    value: 'claude',
  },
];

function normalizeRules(raw) {
  const rules = Array.isArray(raw?.rules) ? raw.rules : Array.isArray(raw) ? raw : [];
  if (!rules.length) return { rules: [...DEFAULT_PREFERENCE_RULES] };
  return { rules };
}

/** Payload for plan/task — contract shape `{ rules: [...] }`. */
export function preferencesPayload(rulesDoc) {
  const doc = rulesDoc || readJson(ACCOUNT_STORAGE_KEYS.preferences, null);
  const rules = (doc?.rules || DEFAULT_PREFERENCE_RULES).filter((r) => r.enabled !== false);
  return { rules: rules.map(({ id, kind, expression, risk, value, label }) => ({
    id,
    ...(kind ? { kind } : {}),
    ...(expression ? { expression } : {}),
    ...(risk ? { risk } : {}),
    ...(value ? { value } : {}),
    ...(label ? { label } : {}),
  })) };
}

export async function getPreferences() {
  try {
    const res = await engineClient.getPreferences();
    const doc = normalizeRules(res);
    writeJson(ACCOUNT_STORAGE_KEYS.preferences, doc);
    return doc;
  } catch (err) {
    if (err?.httpStatus === 404 || err?.httpStatus === 501) {
      const local = readJson(ACCOUNT_STORAGE_KEYS.preferences, null);
      return normalizeRules(local);
    }
    const local = readJson(ACCOUNT_STORAGE_KEYS.preferences, null);
    if (local) return normalizeRules(local);
    throw err;
  }
}

export async function putPreferences(doc) {
  const normalized = normalizeRules(doc);
  try {
    const res = await engineClient.putPreferences(normalized);
    const saved = normalizeRules(res);
    writeJson(ACCOUNT_STORAGE_KEYS.preferences, saved);
    return saved;
  } catch (err) {
    if (err?.httpStatus === 404 || err?.httpStatus === 501) {
      writeJson(ACCOUNT_STORAGE_KEYS.preferences, normalized);
      return normalized;
    }
    writeJson(ACCOUNT_STORAGE_KEYS.preferences, normalized);
    throw err;
  }
}

export async function loadPreferencesForSubmit() {
  try {
    const doc = await getPreferences();
    return preferencesPayload(doc);
  } catch {
    return preferencesPayload(readJson(ACCOUNT_STORAGE_KEYS.preferences, { rules: DEFAULT_PREFERENCE_RULES }));
  }
}
