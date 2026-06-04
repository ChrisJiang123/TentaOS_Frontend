// @ts-nocheck
import React, { createContext, useState, useContext, useEffect } from 'react';
import translations from './translations';
import { strings } from '@/i18n/strings';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof localStorage === 'undefined') return 'en';
    const chosen = localStorage.getItem('tentaos_lang_user_chosen') === '1';
    if (!chosen) return 'en';
    return localStorage.getItem('tentaos_lang') === 'zh' ? 'zh' : 'en';
  });

  const setLangWithChoice = (next) => {
    localStorage.setItem('tentaos_lang_user_chosen', '1');
    localStorage.setItem('tentaos_lang', next);
    setLang(next === 'zh' ? 'zh' : 'en');
  };

  useEffect(() => {
    localStorage.setItem('tentaos_lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const t = (key, vars) => {
    const pack = { ...translations.en, ...strings.en, ...(lang === 'zh' ? { ...translations.zh, ...strings.zh } : {}) };
    let s = pack[key] ?? strings.en[key] ?? translations.en?.[key] ?? key;
    if (vars && typeof s === 'string') {
      Object.entries(vars).forEach(([k, v]) => {
        s = s.replace(`{${k}}`, String(v));
      });
    }
    return s;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLangWithChoice, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}