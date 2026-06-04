// @ts-nocheck
/** Local account-scoped storage (Phase 19 fallback until server prefs are authoritative). */

const KEYS = {
  preferences: 'tentaos_preferences_v1',
  templates: 'tentaos_templates_v1',
  authToken: 'token',
  authUser: 'tentaos_auth_user_v1',
  migrated: 'tentaos_account_migrated_v1',
};

export function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode
  }
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(KEYS.authToken);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(KEYS.authToken, token);
    else localStorage.removeItem(KEYS.authToken);
  } catch {
    // ignore
  }
}

export { KEYS as ACCOUNT_STORAGE_KEYS };
