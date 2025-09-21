import React from 'react';
import { useI18n } from '../hooks/useI18n';

interface ErrorBoundaryProps {
  error?: string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ error, onRetry, children }) => {
  const { t } = useI18n();

  // If there's an error, show error screen
  if (error) {
    return (
      <div className="error-boundary min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
        <div className="text-center max-w-sm">
          {/* Error Icon */}
          <div className="text-8xl mb-6">⚠️</div>
          
          {/* Error Message */}
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            {t('common.error')}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
            {error}
          </p>
          
          {/* Retry Button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
                color: 'var(--tg-theme-button-text-color, #ffffff)'
              }}
            >
              {t('error.try_again')}
            </button>
          )}
          
          {/* Close Button */}
          <button
            onClick={() => {
              if (window.Telegram?.WebApp?.close) {
                window.Telegram.WebApp.close();
              }
            }}
            className="w-full mt-3 py-3 px-4 rounded-lg font-medium border transition-colors"
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
    );
  }

  // If no error, render children
  return <>{children}</>;
};

export { ErrorBoundary };
export default ErrorBoundary;
