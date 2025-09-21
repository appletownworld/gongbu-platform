import React, { useState } from 'react';
import { useI18n, SupportedLanguage } from '../hooks/useI18n';

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const { language, setLanguage, supportedLanguages, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languageNames: Record<SupportedLanguage, string> = {
    en: 'English',
    ko: '한국어',
    ru: 'Русский'
  };

  const languageFlags: Record<SupportedLanguage, string> = {
    en: '🇺🇸',
    ko: '🇰🇷',
    ru: '🇷🇺'
  };

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    setIsOpen(false);
    
    // Показать уведомление об изменении языка
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(`Language changed to ${languageNames[newLanguage]}`);
    }
  };

  if (compact) {
    return (
      <div className={`language-selector-compact ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
          style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
            color: 'var(--tg-theme-text-color, #000000)'
          }}
        >
          <span className="text-sm">{languageFlags[language]}</span>
          <span className="text-xs">{language.toUpperCase()}</span>
        </button>

        {isOpen && (
          <div 
            className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border z-50"
            style={{
              backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
              borderColor: 'var(--tg-theme-hint-color, #999999)'
            }}
          >
            {supportedLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`
                  w-full flex items-center space-x-2 px-3 py-2 text-left text-sm transition-colors
                  ${language === lang
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                  }
                `}
                style={{
                  color: language === lang 
                    ? 'var(--tg-theme-button-color, #2481cc)'
                    : 'var(--tg-theme-text-color, #000000)',
                  backgroundColor: language === lang 
                    ? 'var(--tg-theme-button-color, #2481cc)'
                    : 'transparent'
                }}
              >
                <span className="text-base">{languageFlags[lang]}</span>
                <span>{languageNames[lang]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`language-selector ${className}`}>
      <div className="mb-2">
        <h3 className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
          {t('common.language')}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {supportedLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`
              flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${language === lang
                ? 'ring-2 ring-blue-500'
                : 'hover:bg-gray-50'
              }
            `}
            style={{
              backgroundColor: language === lang 
                ? 'var(--tg-theme-button-color, #2481cc)'
                : 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
              color: language === lang 
                ? 'var(--tg-theme-button-text-color, #ffffff)'
                : 'var(--tg-theme-text-color, #000000)',
              border: language === lang 
                ? '2px solid var(--tg-theme-button-color, #2481cc)'
                : '2px solid transparent'
            }}
          >
            <span className="text-xl">{languageFlags[lang]}</span>
            <div className="flex-1 text-left">
              <div className="font-medium">{languageNames[lang]}</div>
              <div className="text-xs opacity-75">
                {lang === 'en' && 'International'}
                {lang === 'ko' && 'Native language'}
                {lang === 'ru' && 'Русский язык'}
              </div>
            </div>
            {language === lang && (
              <span className="text-blue-500">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
