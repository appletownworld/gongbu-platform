import React, { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { 
  GlobeAltIcon, 
  ChevronDownIcon,
  CheckIcon 
} from '@heroicons/react/24/outline'

interface LanguageSwitcherProps {
  className?: string
  showLabel?: boolean
  variant?: 'dropdown' | 'buttons'
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  showLabel = true,
  variant = 'dropdown' 
}) => {
  const { changeLanguage, getCurrentLanguage, getAvailableLanguages } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLanguage = getCurrentLanguage()
  const availableLanguages = getAvailableLanguages()
  const currentLangData = availableLanguages.find(lang => lang.code === currentLanguage)

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode)
    setIsOpen(false)
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <span className="text-sm text-secondary-600">
            {getCurrentLanguage().toUpperCase()}:
          </span>
        )}
        <div className="flex space-x-1">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                currentLanguage === lang.code
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
              }`}
              title={lang.name}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
      >
        <GlobeAltIcon className="h-4 w-4" />
        {showLabel && (
          <span className="hidden sm:inline">
            {currentLangData?.nativeName || currentLanguage.toUpperCase()}
          </span>
        )}
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 z-20">
            <div className="py-1">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {lang.code === 'en' && '🇺🇸'}
                      {lang.code === 'ko' && '🇰🇷'}
                      {lang.code === 'ru' && '🇷🇺'}
                    </span>
                    <div className="text-left">
                      <div className="font-medium">{lang.nativeName}</div>
                      <div className="text-xs text-secondary-500">{lang.name}</div>
                    </div>
                  </div>
                  {currentLanguage === lang.code && (
                    <CheckIcon className="h-4 w-4 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher
