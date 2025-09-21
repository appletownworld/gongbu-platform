import React from 'react';
import { useI18n } from '../hooks/useI18n';

const LoadingScreen: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="loading-screen min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
      <div className="text-center">
        {/* Logo */}
        <div className="text-8xl mb-6">📚</div>
        
        {/* Loading Animation */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="animate-bounce w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--tg-theme-button-color, #2481cc)' }}></div>
          <div className="animate-bounce w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--tg-theme-button-color, #2481cc)' }}></div>
          <div className="animate-bounce w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--tg-theme-button-color, #2481cc)' }}></div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
          {t('common.loading')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
          Preparing your learning experience...
        </p>
      </div>
    </div>
  );
};

export { LoadingScreen };
export default LoadingScreen;
