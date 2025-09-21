import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Initialize Telegram WebApp
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  
  // Set up theme
  const theme = window.Telegram.WebApp.themeParams;
  if (theme) {
    document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-theme-link-color', theme.link_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color || '#f0f0f0');
  }
  
  // Set document language
  const user = window.Telegram.WebApp.initDataUnsafe?.user;
  if (user?.language_code) {
    document.documentElement.lang = user.language_code;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
