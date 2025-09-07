import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

// Detect browser language
const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
const defaultLang = browserLang.toLowerCase().startsWith('es') ? 'es' : 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: defaultLang,
    lng: localStorage.getItem('preferredLanguage') || defaultLang,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: enTranslations
      },
      es: {
        translation: esTranslations
      }
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferredLanguage'
    }
  });

export default i18n;