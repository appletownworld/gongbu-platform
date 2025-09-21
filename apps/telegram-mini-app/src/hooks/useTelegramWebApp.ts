import { useState, useEffect } from 'react';
import { WebApp } from '@twa-dev/types';

interface UseTelegramWebAppReturn {
  webApp: WebApp | null;
  isReady: boolean;
  user: any;
  theme: any;
}

export const useTelegramWebApp = (): UseTelegramWebAppReturn => {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);

  useEffect(() => {
    const initializeWebApp = () => {
      if (window.Telegram?.WebApp) {
        const tgWebApp = window.Telegram.WebApp;
        
        // Initialize WebApp
        tgWebApp.ready();
        tgWebApp.expand();
        
        // Set up theme
        const themeParams = tgWebApp.themeParams;
        setTheme(themeParams);
        
        // Apply theme to document
        if (themeParams) {
          document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
          document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999');
          document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || '#f0f0f0');
        }
        
        // Get user data
        const userData = tgWebApp.initDataUnsafe?.user;
        if (userData) {
          setUser(userData);
        }
        
        setWebApp(tgWebApp);
        setIsReady(true);
      } else {
        // Fallback for development
        console.warn('Telegram WebApp not available, using mock data');
        setWebApp({
          ready: () => {},
          expand: () => {},
          close: () => {},
          initData: '',
          initDataUnsafe: {
            user: {
              id: 123456789,
              first_name: 'Test',
              last_name: 'User',
              username: 'testuser',
              language_code: 'en'
            }
          },
          version: '6.0',
          platform: 'web',
          colorScheme: 'light',
          themeParams: {
            bg_color: '#ffffff',
            text_color: '#000000',
            hint_color: '#999999',
            link_color: '#2481cc',
            button_color: '#2481cc',
            button_text_color: '#ffffff',
            secondary_bg_color: '#f0f0f0'
          },
          isExpanded: true,
          viewportHeight: window.innerHeight,
          viewportStableHeight: window.innerHeight,
          headerColor: '#ffffff',
          backgroundColor: '#ffffff',
          isClosingConfirmationEnabled: false,
          BackButton: {
            isVisible: false,
            show: () => {},
            hide: () => {},
            onClick: () => {},
            offClick: () => {}
          },
          MainButton: {
            text: 'Continue',
            color: '#2481cc',
            textColor: '#ffffff',
            isVisible: false,
            isProgressVisible: false,
            isActive: true,
            setText: () => {},
            onClick: () => {},
            offClick: () => {},
            show: () => {},
            hide: () => {},
            enable: () => {},
            disable: () => {},
            showProgress: () => {},
            hideProgress: () => {}
          },
          HapticFeedback: {
            impactOccurred: () => {},
            notificationOccurred: () => {},
            selectionChanged: () => {}
          },
          CloudStorage: {
            setItem: () => {},
            getItem: () => {},
            getItems: () => {},
            removeItem: () => {},
            removeItems: () => {},
            getKeys: () => {}
          },
          BiometricManager: {
            isInited: false,
            isBiometricAvailable: false,
            biometricType: 'unknown',
            isAccessRequested: false,
            isAccessGranted: false,
            isBiometricTokenSaved: false,
            deviceId: '',
            init: () => {},
            requestAccess: () => {},
            authenticate: () => {},
            updateBiometricToken: () => {},
            openSettings: () => {}
          },
          onEvent: () => {},
          offEvent: () => {},
          sendData: () => {},
          switchInlineQuery: () => {},
          openLink: () => {},
          openTelegramLink: () => {},
          openInvoice: () => {},
          showPopup: () => {},
          showAlert: (message: string) => {
            alert(message);
          },
          showConfirm: (message: string) => {
            return confirm(message);
          },
          showScanQrPopup: () => {},
          closeScanQrPopup: () => {},
          readTextFromClipboard: () => {},
          requestWriteAccess: () => {},
          requestContact: () => {}
        } as any);
        setUser({
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'en'
        });
        setIsReady(true);
      }
    };

    // Initialize when component mounts
    initializeWebApp();
  }, []);

  return {
    webApp,
    isReady,
    user,
    theme
  };
};