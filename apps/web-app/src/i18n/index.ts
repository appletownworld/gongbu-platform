import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enCommon from '../locales/en/common.json'
import koCommon from '../locales/ko/common.json'
import ruCommon from '../locales/ru/common.json'

const resources = {
  en: {
    common: enCommon,
  },
  ko: {
    common: koCommon,
  },
  ru: {
    common: ruCommon,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'gongbu_language',
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Namespace configuration
    defaultNS: 'common',
    ns: ['common'],

    // React i18next options
    react: {
      useSuspense: false,
    },
  })

export default i18n
