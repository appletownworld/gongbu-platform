import { useTranslation as useI18nTranslation } from 'react-i18next'

export const useTranslation = (namespace: string = 'common') => {
  const { t, i18n } = useI18nTranslation(namespace)

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language)
    localStorage.setItem('gongbu_language', language)
  }

  const getCurrentLanguage = () => {
    return i18n.language
  }

  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    ]
  }

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    isReady: i18n.isInitialized,
  }
}

export default useTranslation
