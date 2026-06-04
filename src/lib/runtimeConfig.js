// @ts-nocheck
/**
 * Engine API / WebSocket endpoints.
 * Build-time: VITE_ENGINE_URL, VITE_API_URL, VITE_WS_URL
 * Runtime override: localStorage tentaos_engine_url / tentaos_ws_url (no rebuild)
 */

const STORAGE_ENGINE = 'tentaos_engine_url';
const STORAGE_WS = 'tentaos_ws_url';

function trimUrl(v) {
  if (v == null || v === '') return '';
  return String(v).trim().replace(/\/$/, '');
}

function wsFromHttp(httpBase) {
  if (!httpBase) return '';
  try {
    const url = new URL(httpBase);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
  } catch {
    if (httpBase.startsWith('https://')) return `${httpBase.replace(/^https:/, 'wss:')}/ws`;
    if (httpBase.startsWith('http://')) return `${httpBase.replace(/^http:/, 'ws:')}/ws`;
    return '';
  }
}

/** Public demo Engine (Cloudflare Tunnel) — default for production/preview */
export const DEFAULT_DEMO_ENGINE_URL = 'https://engine.tentaos.com';
export const DEFAULT_DEMO_WS_URL = 'wss://engine.tentaos.com/ws';

const BUILD_ENGINE_URL =
  trimUrl(import.meta.env.VITE_ENGINE_URL) || trimUrl(import.meta.env.VITE_API_URL) || '';
const BUILD_WS_URL = trimUrl(import.meta.env.VITE_WS_URL) || '';

const isProd = import.meta.env.PROD;
const isDev = import.meta.env.DEV;

function getStoredEngineUrl() {
  if (typeof window === 'undefined') return '';
  return trimUrl(localStorage.getItem(STORAGE_ENGINE));
}

function getStoredWsUrl() {
  if (typeof window === 'undefined') return '';
  return trimUrl(localStorage.getItem(STORAGE_WS));
}

function resolveEngineUrl() {
  const stored = getStoredEngineUrl();
  if (stored) return stored;
  if (BUILD_ENGINE_URL) return BUILD_ENGINE_URL;
  if (isProd) return DEFAULT_DEMO_ENGINE_URL;
  return 'http://localhost:3001';
}

function resolveWsUrl(httpUrl) {
  const storedWs = getStoredWsUrl();
  if (storedWs) return storedWs;
  if (BUILD_WS_URL) return BUILD_WS_URL;
  const derived = wsFromHttp(httpUrl);
  if (derived) return derived;
  return isProd ? DEFAULT_DEMO_WS_URL : 'ws://localhost:3001/ws';
}

/** Resolved HTTP base for Engine REST API (evaluated at module load; reload after setEngineUrl) */
export const ENGINE_URL = resolveEngineUrl();

/** Resolved WebSocket URL */
export const WS_URL = resolveWsUrl(ENGINE_URL);

export const RUNTIME_CONFIG = {
  engineUrl: ENGINE_URL,
  wsUrl: WS_URL,
  mode: isProd ? 'production' : 'development',
  usingLocalhostFallback: !BUILD_ENGINE_URL && !getStoredEngineUrl() && !isProd,
  hasEngineUrlOverride: !!getStoredEngineUrl(),
  hasWsUrlOverride: !!getStoredWsUrl(),
  buildEngineUrl: BUILD_ENGINE_URL || '(unset)',
  buildWsUrl: BUILD_WS_URL || '(unset)',
  envSources: {
    VITE_ENGINE_URL: !!import.meta.env.VITE_ENGINE_URL,
    VITE_API_URL: !!import.meta.env.VITE_API_URL,
    VITE_WS_URL: !!import.meta.env.VITE_WS_URL,
  },
};

export function hasEngineUrlOverride() {
  return !!getStoredEngineUrl();
}

export function hasWsUrlOverride() {
  return !!getStoredWsUrl();
}

/** Persist Engine URL without reload (used after successful auto-connect) */
export function saveEngineUrlQuiet(url, wsUrl) {
  if (typeof window === 'undefined') return;
  const clean = trimUrl(url);
  if (!clean) return;
  localStorage.setItem(STORAGE_ENGINE, clean);
  if (wsUrl) {
    localStorage.setItem(STORAGE_WS, trimUrl(wsUrl));
  } else {
    localStorage.removeItem(STORAGE_WS);
  }
}

/** Fetch Engine health JSON (no-store, cache-busted). */
export async function fetchEngineHealth(baseUrl = DEFAULT_DEMO_ENGINE_URL) {
  const clean = trimUrl(baseUrl);
  if (!clean) return null;
  const res = await fetch(`${clean}/api/health?t=${Date.now()}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
  });
  if (!res.ok) return null;
  return res.json();
}

/** Probe Engine health at a base URL (no-store, cache-busted) */
export async function probeEngineHealth(baseUrl = DEFAULT_DEMO_ENGINE_URL) {
  try {
    const data = await fetchEngineHealth(baseUrl);
    return Boolean(data?.status);
  } catch {
    return false;
  }
}

/** Apply backend health hints (e.g. inferred_ws_url). */
export function endpointsFromHealth(health, fallbackHttp = DEFAULT_DEMO_ENGINE_URL) {
  const engineUrl = trimUrl(health?.engine_url) || trimUrl(fallbackHttp);
  const wsUrl =
    trimUrl(health?.inferred_ws_url) ||
    trimUrl(health?.ws_url) ||
    wsFromHttp(engineUrl) ||
    DEFAULT_DEMO_WS_URL;
  return { engineUrl, wsUrl };
}

/**
 * In production/preview with no saved Engine URL, probe the public demo Engine.
 * On success, persist URLs so subsequent loads skip ConnectionGate when healthy.
 */
export async function bootstrapDemoEngineIfNeeded() {
  if (typeof window === 'undefined' || !isProd) return { bootstrapped: false, ok: false };
  if (getStoredEngineUrl()) return { bootstrapped: false, ok: true, reason: 'stored' };

  const targetUrl = BUILD_ENGINE_URL || DEFAULT_DEMO_ENGINE_URL;
  const health = await fetchEngineHealth(targetUrl);
  const { engineUrl, wsUrl } = endpointsFromHealth(health, targetUrl);
  if (health?.status) {
    saveEngineUrlQuiet(engineUrl, wsUrl);
    return { bootstrapped: true, ok: true, engineUrl, wsUrl, health };
  }
  return { bootstrapped: true, ok: false, engineUrl: targetUrl, health: null };
}

/** Persist Engine URL and reload (WS derived from HTTP unless explicitly stored) */
export function setEngineUrl(url) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_ENGINE, trimUrl(url));
  localStorage.removeItem(STORAGE_WS);
  window.location.reload();
}

export function clearEngineUrlOverride() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_ENGINE);
  localStorage.removeItem(STORAGE_WS);
  window.location.reload();
}

export function assertEngineConfigured() {
  if (!ENGINE_URL) {
    throw new Error(
      'Engine URL is not configured. Set VITE_ENGINE_URL in .env.local or enter URL in Settings.',
    );
  }
}

export function isLocalhostUrl(url) {
  if (!url) return false;
  try {
    const h = new URL(url).hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}
