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
  return isProd ? '' : 'http://localhost:3001';
}

function resolveWsUrl(httpUrl) {
  const storedWs = getStoredWsUrl();
  if (storedWs) return storedWs;
  if (BUILD_WS_URL) return BUILD_WS_URL;
  return wsFromHttp(httpUrl) || (isProd ? '' : 'ws://localhost:3001/ws');
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
