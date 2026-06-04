// @ts-nocheck
import engineClient from './engineClient.js';
import { readJson, writeJson, ACCOUNT_STORAGE_KEYS } from './accountStorage.js';

function normalizeTemplates(res) {
  const list = Array.isArray(res?.templates) ? res.templates : Array.isArray(res) ? res : [];
  return list.map((t) => ({
    id: String(t.id ?? t.template_id ?? `tpl-${t.name}`),
    name: String(t.name ?? 'Untitled'),
    steps: Array.isArray(t.steps) ? t.steps : [],
    created_at: t.created_at ?? t.created_date,
  }));
}

export async function listTemplates() {
  try {
    const res = await engineClient.listTemplates();
    const templates = normalizeTemplates(res);
    writeJson(ACCOUNT_STORAGE_KEYS.templates, templates);
    return templates;
  } catch (err) {
    if (err?.httpStatus === 404 || err?.httpStatus === 501) {
      return readJson(ACCOUNT_STORAGE_KEYS.templates, []);
    }
    return readJson(ACCOUNT_STORAGE_KEYS.templates, []);
  }
}

export async function createTemplate({ name, steps }) {
  const payload = { name: String(name || '').trim(), steps: steps || [] };
  if (!payload.name) throw new Error('模板名称不能为空');
  try {
    const res = await engineClient.createTemplate(payload);
    const created = res?.template ?? res;
    const tpl = {
      id: String(created?.id ?? `tpl-${Date.now()}`),
      name: payload.name,
      steps: payload.steps,
      created_at: new Date().toISOString(),
    };
    const local = readJson(ACCOUNT_STORAGE_KEYS.templates, []);
    writeJson(ACCOUNT_STORAGE_KEYS.templates, [tpl, ...local]);
    return tpl;
  } catch (err) {
    if (err?.httpStatus === 404 || err?.httpStatus === 501) {
      const tpl = {
        id: `local-${Date.now()}`,
        name: payload.name,
        steps: payload.steps,
        created_at: new Date().toISOString(),
      };
      const local = readJson(ACCOUNT_STORAGE_KEYS.templates, []);
      writeJson(ACCOUNT_STORAGE_KEYS.templates, [tpl, ...local]);
      return tpl;
    }
    throw err;
  }
}
