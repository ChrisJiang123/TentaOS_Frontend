// @ts-nocheck
import React, { createContext, useState, useContext, useEffect } from 'react';
import translations from './translations';
import { strings } from '@/i18n/strings';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('tentaos_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('tentaos_lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const t = (key, vars) => {
    let s =
      strings[lang]?.[key] ??
      translations[lang]?.[key] ??
      strings.en[key] ??
      translations.en?.[key] ??
      key;
    if (vars && typeof s === 'string') {
      Object.entries(vars).forEach(([k, v]) => {
        s = s.replace(`{${k}}`, String(v));
      });
    }
    return s;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
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