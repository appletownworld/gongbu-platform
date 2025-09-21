import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n';

interface LoginScreenProps {
  onLogin: (initData: string) => Promise<void>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);

  const handleTelegramLogin = async () => {
    setIsLoading(true);
    
    try {
      // Get init data from Telegram WebApp
      const initData = window.Telegram?.WebApp?.initData || '';
      
      if (!initData) {
        throw new Error('Telegram WebApp not available');
      }

      await onLogin(initData);
      
      // Show success message
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(t('auth.login_success'));
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Show error message
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(t('error.network_error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
      <div className="w-full max-w-sm">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">📚</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            Gongbu
          </h1>
          <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
            {t('auth.welcome')}
          </p>
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          <button
            onClick={handleTelegramLogin}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center space-x-3 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
              color: 'var(--tg-theme-button-text-color, #ffffff)'
            }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>{t('common.loading')}</span>
              </>
            ) : (
              <>
                <span className="text-xl">📱</span>
                <span>{t('auth.login_with_telegram')}</span>
              </>
            )}
          </button>

          {/* Info */}
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
              By logging in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center space-x-3 text-sm" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            <span className="text-lg">🎓</span>
            <span>Access to thousands of courses</span>
          </div>
          <div className="flex items-center space-x-3 text-sm" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            <span className="text-lg">📱</span>
            <span>Learn on any device</span>
          </div>
          <div className="flex items-center space-x-3 text-sm" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            <span className="text-lg">🌍</span>
            <span>Multi-language support</span>
          </div>
          <div className="flex items-center space-x-3 text-sm" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            <span className="text-lg">⚡</span>
            <span>Fast and secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { LoginScreen };
export default LoginScreen;
