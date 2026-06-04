// @ts-nocheck
import engineClient from './engineClient.js';
import {
  readJson,
  writeJson,
  getAuthToken,
  setAuthToken,
  ACCOUNT_STORAGE_KEYS,
} from './accountStorage.js';
import { getPreferences } from './preferencesApi.js';
import { listTemplates } from './templatesApi.js';

export function getStoredUser() {
  return readJson(ACCOUNT_STORAGE_KEYS.authUser, null);
}

export function setStoredUser(user) {
  if (user) writeJson(ACCOUNT_STORAGE_KEYS.authUser, user);
}

/** Migrate local prefs/templates to account after first successful login. */
export async function migrateLocalAccountData() {
  if (readJson(ACCOUNT_STORAGE_KEYS.migrated, false)) return;
  try {
    await getPreferences();
    await listTemplates();
    writeJson(ACCOUNT_STORAGE_KEYS.migrated, true);
  } catch {
    // keep local fallback
  }
}

export async function loginWithEmail(email, password) {
  const res = await engineClient.authLogin({ email, password });
  const token = res?.token ?? res?.access_token;
  if (!token) throw new Error('登录响应缺少 token');
  setAuthToken(token);
  const user = res?.user ?? { email, full_name: email.split('@')[0] };
  setStoredUser(user);
  await migrateLocalAccountData();
  return { token, user };
}

export async function loginDemo() {
  const user = { email: 'demo@local', full_name: 'Local User', role: 'user' };
  setStoredUser(user);
  setAuthToken(null);
  return { user, demo: true };
}

export async function refreshSession() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await engineClient.authRefresh();
    const next = res?.token ?? res?.access_token;
    if (next) setAuthToken(next);
    if (res?.user) setStoredUser(res.user);
    return res;
  } catch {
    return null;
  }
}

export async function fetchAuthMe() {
  const token = getAuthToken();
  if (!token) return getStoredUser();
  try {
    const res = await engineClient.authMe();
    const user = res?.user ?? res;
    if (user) setStoredUser(user);
    return user;
  } catch {
    return getStoredUser();
  }
}

export function logoutLocal() {
  setAuthToken(null);
  try {
    localStorage.removeItem(ACCOUNT_STORAGE_KEYS.authUser);
  } catch {
    // ignore
  }
}
