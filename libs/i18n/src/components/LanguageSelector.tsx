import React from 'react';
import { useI18n, SupportedLanguage } from '../hooks/useI18n';

interface LanguageSelectorProps {
  className?: string;
  showLabels?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  showLabels = true 
}) => {
  const { language, setLanguage, supportedLanguages, t } = useI18n();

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
  };

  return (
    <div className={`language-selector ${className}`}>
      {showLabels && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('common.language')}
        </label>
      )}
      
      <div className="flex space-x-2">
        {supportedLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${language === lang
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }
            `}
            title={languageNames[lang]}
          >
            <span className="text-lg">{languageFlags[lang]}</span>
            {showLabels && (
              <span>{languageNames[lang]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
