// Re-export runtime engine config (single source of truth in runtimeConfig.js)
export {
  ENGINE_URL,
  WS_URL,
  DEFAULT_DEMO_ENGINE_URL,
  DEFAULT_DEMO_WS_URL,
  setEngineUrl,
  clearEngineUrlOverride,
  hasEngineUrlOverride,
  hasWsUrlOverride,
  saveEngineUrlQuiet,
  probeEngineHealth,
  bootstrapDemoEngineIfNeeded,
} from './lib/runtimeConfig';

export { hasEngineUrlOverride as hasEngineOverride, clearEngineUrlOverride as clearEngineUrl } from './lib/runtimeConfig';
