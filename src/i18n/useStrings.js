// @ts-nocheck
import { useLanguage } from '@/lib/LanguageContext';
import { strings } from './strings';

/** UI strings for current locale (default en). */
export function useStrings() {
  const { lang } = useLanguage();
  const pack = strings[lang] || strings.en;
  const t = (key, vars) => {
    let s = pack[key] ?? strings.en[key] ?? key;
    if (vars && typeof s === 'string') {
      Object.entries(vars).forEach(([k, v]) => {
        s = s.replace(`{${k}}`, String(v));
      });
    }
    return s;
  };
  return { t, lang };
}

export function tStatic(key, lang = 'en', vars) {
  let s = strings[lang]?.[key] ?? strings.en[key] ?? key;
  if (vars && typeof s === 'string') {
    Object.entries(vars).forEach(([k, v]) => {
      s = s.replace(`{${k}}`, String(v));
    });
  }
  return s;
}
