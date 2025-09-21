import React from 'react';
import { useI18n } from '../hooks/useI18n';
import LanguageSelector from './LanguageSelector';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { t } = useI18n();

  const handleBack = () => {
    if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    onBack();
  };

  return (
    <div className="settings-screen min-h-screen p-4" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ 
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
            color: 'var(--tg-theme-text-color, #000000)'
          }}
        >
          <span className="text-lg">←</span>
          <span className="text-sm font-medium">{t('common.back')}</span>
        </button>
        
        <h1 className="text-lg font-semibold" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
          {t('common.settings')}
        </h1>
        
        <div className="w-16"></div> {/* Spacer for centering */}
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {/* Language Settings */}
        <div className="bg-white rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
          <LanguageSelector />
        </div>

        {/* App Information */}
        <div className="bg-white rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            App Information
          </h3>
          
          <div className="space-y-2 text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
            <div className="flex justify-between">
              <span>Version:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Platform:</span>
              <span>Telegram Mini App</span>
            </div>
            <div className="flex justify-between">
              <span>Language:</span>
              <span>{t('common.language')}</span>
            </div>
          </div>
        </div>

        {/* Telegram WebApp Info */}
        {window.Telegram?.WebApp && (
          <div className="bg-white rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
              Telegram Info
            </h3>
            
            <div className="space-y-2 text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
              <div className="flex justify-between">
                <span>Platform:</span>
                <span>{window.Telegram.WebApp.platform}</span>
              </div>
              <div className="flex justify-between">
                <span>Version:</span>
                <span>{window.Telegram.WebApp.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Theme:</span>
                <span>{window.Telegram.WebApp.colorScheme}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => {
              if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert('Thank you for using Gongbu!');
              }
            }}
            className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
              color: 'var(--tg-theme-button-text-color, #ffffff)'
            }}
          >
            {t('common.confirm')}
          </button>
          
          <button
            onClick={() => {
              if (window.Telegram?.WebApp?.close) {
                window.Telegram.WebApp.close();
              }
            }}
            className="w-full py-3 px-4 rounded-lg font-medium border transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--tg-theme-text-color, #000000)',
              borderColor: 'var(--tg-theme-hint-color, #999999)'
            }}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
