/**
 * 🔐 Telegram WebApp автоматическая авторизация
 * Автоматически регистрирует/авторизует пользователей через Telegram данные
 */

import { apiClient } from './api'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
  is_premium?: boolean
}

export interface TelegramWebAppInitData {
  user?: TelegramUser
  query_id?: string
  auth_date?: number
  hash?: string
}

export interface AuthUser {
  id: string
  telegramId: number
  username?: string
  firstName: string
  lastName?: string
  role: string
  subscription: string
  isActive: boolean
  accessToken: string
  refreshToken: string
}

/**
 * Получить данные пользователя из Telegram WebApp
 */
export function getTelegramUser(): TelegramUser | null {
  if (typeof window === 'undefined') return null
  
  const tg = window.Telegram?.WebApp
  if (!tg) return null
  
  return tg.initDataUnsafe?.user || null
}

/**
 * Проверить, запущено ли приложение в Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp
}

/**
 * Получить полные данные инициализации Telegram WebApp
 */
export function getTelegramInitData(): TelegramWebAppInitData | null {
  if (typeof window === 'undefined') return null
  
  const tg = window.Telegram?.WebApp
  if (!tg) return null
  
  return {
    user: tg.initDataUnsafe?.user,
    query_id: tg.initDataUnsafe?.query_id,
    auth_date: tg.initDataUnsafe?.auth_date,
    hash: tg.initDataUnsafe?.hash
  }
}

/**
 * Автоматическая авторизация через Telegram WebApp
 * Создает или получает существующего пользователя
 */
export async function autoAuthWithTelegram(): Promise<AuthUser | null> {
  try {
    // Проверяем, что мы в Telegram WebApp
    if (!isTelegramWebApp()) {
      console.log('🔍 Не Telegram WebApp - используем гостевой режим')
      return null
    }

    const telegramUser = getTelegramUser()
    if (!telegramUser) {
      console.log('❌ Данные пользователя Telegram недоступны')
      return null
    }

    console.log('🔐 Автоматическая авторизация через Telegram...')
    console.log('👤 Пользователь:', {
      id: telegramUser.id,
      name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`,
      username: telegramUser.username
    })

    // Получаем полные initData для безопасной авторизации
    const initData = getTelegramInitData()
    
    // Отправляем запрос на авторизацию через Telegram
    const response = await apiClient.post<{ user: AuthUser }>('/auth/telegram-login', {
      telegramUser: {
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        language_code: telegramUser.language_code,
        photo_url: telegramUser.photo_url,
        is_premium: telegramUser.is_premium
      },
      initData: {
        query_id: initData?.query_id,
        auth_date: initData?.auth_date,
        hash: initData?.hash
      },
      source: 'webapp'
    })

    const authUser = response.data.user
    
    // Сохраняем токены для последующих запросов
    localStorage.setItem('accessToken', authUser.accessToken)
    localStorage.setItem('refreshToken', authUser.refreshToken)
    localStorage.setItem('user', JSON.stringify(authUser))

    // Настраиваем API клиент для авторизованных запросов
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authUser.accessToken}`

    console.log('✅ Автоматическая авторизация успешна!')
    console.log('👤 Авторизован как:', authUser.firstName, authUser.lastName || '')
    console.log('🎭 Роль:', authUser.role)
    
    return authUser

  } catch (error: any) {
    console.error('❌ Ошибка автоматической авторизации:', error)
    
    if (error.response?.status === 401) {
      console.log('🔐 Необходима повторная авторизация')
    } else if (error.response?.status === 403) {
      console.log('🚫 Пользователь заблокирован')
    } else {
      console.log('⚠️ Работаем в гостевом режиме')
    }
    
    return null
  }
}

/**
 * Получить сохраненного пользователя из localStorage
 */
export function getSavedUser(): AuthUser | null {
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

/**
 * Очистить данные авторизации
 */
export function clearAuth(): void {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken') 
  localStorage.removeItem('user')
  delete apiClient.defaults.headers.common['Authorization']
}

/**
 * Проверить, авторизован ли пользователь
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('accessToken')
  const user = getSavedUser()
  return !!(token && user)
}

/**
 * Настроить автоматическое обновление токенов
 */
export function setupTokenRefresh(): void {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken')
        
        if (refreshToken) {
          try {
            console.log('🔄 Обновление токена...')
            
            const response = await apiClient.post('/auth/refresh', {
              refreshToken
            })
            
            const { accessToken, user } = response.data
            
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('user', JSON.stringify(user))
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
            
            console.log('✅ Токен обновлен')
            
            // Повторить исходный запрос
            return apiClient.request(error.config)
            
          } catch (refreshError) {
            console.error('❌ Ошибка обновления токена:', refreshError)
            clearAuth()
            
            // Повторная автоматическая авторизация через Telegram
            await autoAuthWithTelegram()
          }
        }
      }
      
      return Promise.reject(error)
    }
  )
}
