import { authApi } from './api'
import { User } from '@/types/auth'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            language_code?: string;
          };
          auth_date?: number;
          hash?: string;
        };
        ready(): void;
        expand(): void;
        close(): void;
        isExpanded: boolean;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isProgressVisible: boolean;
          isActive: boolean;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          showProgress(): void;
          hideProgress(): void;
          setText(text: string): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        BackButton: {
          isVisible: boolean;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
      };
    };
  }
}

const ACCESS_TOKEN_KEY = 'gongbu_access_token'
const REFRESH_TOKEN_KEY = 'gongbu_refresh_token'
const USER_DATA_KEY = 'gongbu_user_data'

export interface AutoAuthResult {
  success: boolean;
  user?: User;
  error?: string;
  source: 'telegram' | 'stored_tokens' | 'none';
}

class AutoAuthService {
  /**
   * Главная функция автоматической авторизации
   */
  async attemptAutoAuth(): Promise<AutoAuthResult> {
    console.log('🔐 Начинаем автоматическую авторизацию...')

    // 1. Сначала проверяем сохраненные токены
    const storedResult = await this.tryStoredTokens()
    if (storedResult.success) {
      console.log('✅ Авторизация через сохраненные токены успешна')
      return storedResult
    }

    // 2. Затем пробуем Telegram WebApp
    const telegramResult = await this.tryTelegramAuth()
    if (telegramResult.success) {
      console.log('✅ Авторизация через Telegram WebApp успешна')
      return telegramResult
    }

    // 3. Если ничего не сработало
    console.log('❌ Автоматическая авторизация не удалась')
    return {
      success: false,
      source: 'none',
      error: 'No valid authentication method found'
    }
  }

  /**
   * Попытка авторизации через сохраненные токены
   */
  private async tryStoredTokens(): Promise<AutoAuthResult> {
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!accessToken) {
        return { success: false, source: 'stored_tokens', error: 'No stored token' }
      }

      // Проверяем валидность токена через API
      const user = await authApi.getProfile()
      
      // Сохраняем данные пользователя
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
      
      return {
        success: true,
        user,
        source: 'stored_tokens'
      }
    } catch (error: any) {
      console.error('Stored token auth failed:', error)
      
      // Если токен недействителен, пробуем refresh
      try {
        await this.tryRefreshToken()
        const user = await authApi.getProfile()
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
        
        return {
          success: true,
          user,
          source: 'stored_tokens'
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        this.clearAuthData()
        return { success: false, source: 'stored_tokens', error: error.message }
      }
    }
  }

  /**
   * Попытка авторизации через Telegram WebApp
   */
  private async tryTelegramAuth(): Promise<AutoAuthResult> {
    try {
      if (!this.isTelegramWebApp()) {
        return { success: false, source: 'telegram', error: 'Not in Telegram WebApp' }
      }

      const initData = this.getTelegramInitData()
      if (!initData) {
        return { success: false, source: 'telegram', error: 'No Telegram initData' }
      }

      // Инициализируем Telegram WebApp
      this.initializeTelegramWebApp()

      // Авторизуемся через API
      const response = await authApi.login({
        initData,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: 'web',
          version: '1.0.0',
          isTelegramWebApp: true
        },
        ipAddress: '127.0.0.1' // Will be replaced by server
      })

      // Сохраняем токены и данные пользователя
      localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user))

      return {
        success: true,
        user: response.user,
        source: 'telegram'
      }
    } catch (error: any) {
      console.error('Telegram auth failed:', error)
      return { success: false, source: 'telegram', error: error.message }
    }
  }

  /**
   * Попытка обновления токена
   */
  private async tryRefreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await authApi.refreshToken(refreshToken)
    
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
  }

  /**
   * Инициализация Telegram WebApp
   */
  private initializeTelegramWebApp(): void {
    if (!window.Telegram?.WebApp) return

    const tg = window.Telegram.WebApp
    
    // Инициализируем WebApp
    tg.ready()
    
    // Раскрываем на весь экран
    if (!tg.isExpanded) {
      tg.expand()
    }

    console.log('📱 Telegram WebApp инициализировано')
  }

  /**
   * Проверка, запущено ли приложение в Telegram WebApp
   */
  isTelegramWebApp(): boolean {
    return !!(
      window.Telegram?.WebApp && 
      window.Telegram.WebApp.initData
    )
  }

  /**
   * Получение initData от Telegram
   */
  getTelegramInitData(): string | null {
    return window.Telegram?.WebApp?.initData || null
  }

  /**
   * Получение данных пользователя от Telegram
   */
  getTelegramUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user
  }

  /**
   * Получение сохраненного пользователя
   */
  getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY)
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }

  /**
   * Очистка данных авторизации
   */
  clearAuthData(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_DATA_KEY)
    console.log('🧹 Данные авторизации очищены')
  }

  /**
   * Логаут с очисткой данных
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      this.clearAuthData()
    }
  }

  /**
   * Настройка автоматического обновления токенов
   */
  setupTokenRefresh(): void {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (accessToken) {
      // Токен будет автоматически подставлен в axios interceptor
      console.log('🔄 Автообновление токенов настроено')
    }
  }

  /**
   * Получение текущего токена доступа
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  /**
   * Получение refresh токена
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Проверка авторизации пользователя
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    const user = this.getStoredUser()
    return !!(token && user)
  }

  /**
   * Генерация mock данных для разработки
   */
  generateMockTelegramData(): string {
    const mockUser = {
      id: Date.now(),
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru',
      photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
    }
    
    const mockInitData = `user=${encodeURIComponent(JSON.stringify(mockUser))}&auth_date=${Math.floor(Date.now() / 1000)}&hash=mock_hash_for_development`
    
    console.log('🔧 Сгенерированы тестовые Telegram данные:', mockUser)
    return mockInitData
  }
}

export const autoAuthService = new AutoAuthService()
export default autoAuthService
