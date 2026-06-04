// @ts-nocheck
import { useLanguage } from '@/lib/LanguageContext';
import translations from '@/lib/translations';
import { strings } from './strings';

/** UI strings — same `t()` as LanguageContext (default English). */
export function useStrings() {
  return useLanguage();
}

export function tStatic(key, lang = 'en', vars) {
  const pack =
    lang === 'zh'
      ? { ...translations.en, ...strings.en, ...translations.zh, ...strings.zh }
      : { ...translations.en, ...strings.en };
  let s = pack[key] ?? strings.en[key] ?? translations.en?.[key] ?? key;
  if (vars && typeof s === 'string') {
    Object.entries(vars).forEach(([k, v]) => {
      s = s.replace(`{${k}}`, String(v));
    });
  }
  return s;
}

export function getAppLang() {
  if (typeof localStorage === 'undefined') return 'en';
  if (localStorage.getItem('tentaos_lang_user_chosen') !== '1') return 'en';
  return localStorage.getItem('tentaos_lang') === 'zh' ? 'zh' : 'en';
}
