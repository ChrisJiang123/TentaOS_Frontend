// ── TentaOS Engine 连接配置 ──
// Vite 的 import.meta.env 是【构建时】注入的；为了在 Vercel 部署后
// 不重新 build 也能切换 Engine 地址（例如每次 ngrok 重启换了地址），
// 这里支持【运行时】用 localStorage 覆盖。

const BUILD_ENGINE_URL = import.meta.env.VITE_ENGINE_URL || '';
const BUILD_WS_URL = import.meta.env.VITE_WS_URL || '';
const DEFAULT_ENGINE_URL = 'http://localhost:3001';

function readOverride(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('tentaos_engine_url') || '';
  } catch {
    return '';
  }
}

function computeEngineUrl(): string {
  return readOverride() || BUILD_ENGINE_URL || DEFAULT_ENGINE_URL;
}

function deriveWsUrl(httpUrl: string): string {
  if (BUILD_WS_URL && !readOverride()) return BUILD_WS_URL;
  try {
    const u = new URL(httpUrl);
    const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${u.host}/ws`;
  } catch {
    return 'ws://localhost:3001/ws';
  }
}

export const ENGINE_URL = computeEngineUrl();
export const WS_URL = deriveWsUrl(ENGINE_URL);

export function hasEngineOverride(): boolean {
  return Boolean(readOverride());
}

/** 运行时设置 Engine 地址（写 localStorage 后刷新页面生效，无需重新 build）。 */
export function setEngineUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, '');
  if (!clean) return;
  localStorage.setItem('tentaos_engine_url', clean);
  window.location.reload();
}

export function clearEngineUrl(): void {
  localStorage.removeItem('tentaos_engine_url');
  window.location.reload();
}

// 兼容旧页面 import 名称
export const hasEngineUrlOverride = hasEngineOverride;
export const clearEngineUrlOverride = clearEngineUrl;
export function hasWsUrlOverride(): boolean {
  return false;
}
