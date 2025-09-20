import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, UserRole } from '@/types/auth'
import { authApi } from '@/services/api'
import { autoAuthService, AutoAuthResult } from '@/services/autoAuth'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  authSource: 'telegram' | 'stored_tokens' | 'none' | null
  login: (initData: string) => Promise<void>
  autoLogin: () => Promise<boolean>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  hasRole: (role: UserRole | UserRole[]) => boolean
  isTelegramWebApp: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authSource, setAuthSource] = useState<'telegram' | 'stored_tokens' | 'none' | null>(null)

  const isAuthenticated = !!user

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('🔐 Инициализация системы авторизации...')
      
      // Настройка автоматического обновления токенов
      autoAuthService.setupTokenRefresh()
      
      // Попытка автоматической авторизации
      const result: AutoAuthResult = await autoAuthService.attemptAutoAuth()
      
      if (result.success && result.user) {
        setUser(result.user)
        setAuthSource(result.source)
        
        const sourceMessages = {
          'telegram': '✅ Автоматическая авторизация через Telegram WebApp',
          'stored_tokens': '✅ Автоматическая авторизация через сохраненные токены'
        }
        
        console.log(sourceMessages[result.source])
        
        // Показываем уведомление только для Telegram авторизации
        if (result.source === 'telegram') {
          toast.success('🚀 Добро пожаловать в Gongbu!', {
            duration: 3000,
            icon: '👋'
          })
        }
      } else {
        setAuthSource('none')
        console.log('ℹ️ Пользователь не авторизован')
      }
    } catch (error) {
      console.error('❌ Ошибка инициализации авторизации:', error)
      setAuthSource('none')
      
      // Очищаем поврежденные данные
      autoAuthService.clearAuthData()
    } finally {
      setIsLoading(false)
      console.log('🏁 Инициализация авторизации завершена')
    }
  }

  const login = async (initData: string) => {
    try {
      setIsLoading(true)
      
      const response = await authApi.login({
        initData,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: 'web',
          version: '1.0.0',
          isTelegramWebApp: autoAuthService.isTelegramWebApp()
        },
        ipAddress: '127.0.0.1', // Will be replaced by actual IP in production
      })

      // Store tokens через autoAuthService
      localStorage.setItem('gongbu_access_token', response.accessToken)
      localStorage.setItem('gongbu_refresh_token', response.refreshToken)
      localStorage.setItem('gongbu_user_data', JSON.stringify(response.user))

      // Set user data
      setUser(response.user)
      setAuthSource('telegram')
      
      toast.success('🎉 Добро пожаловать!', {
        duration: 4000,
        icon: '🚀'
      })
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.message || 'Ошибка входа в систему'
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const autoLogin = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const result: AutoAuthResult = await autoAuthService.attemptAutoAuth()
      
      if (result.success && result.user) {
        setUser(result.user)
        setAuthSource(result.source)
        console.log(`✅ Автоматический вход выполнен через: ${result.source}`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Auto login failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      console.log('🚪 Выход из системы...')
      
      // Используем autoAuthService для логаута
      await autoAuthService.logout()
      
      // Очищаем состояние
      setUser(null)
      setAuthSource('none')
      
      toast.success('👋 До свидания! Вы вышли из системы', {
        duration: 3000,
        icon: '✅'
      })
      
      console.log('✅ Выход из системы выполнен')
    } catch (error) {
      console.error('❌ Ошибка при выходе:', error)
      
      // В любом случае очищаем состояние локально
      autoAuthService.clearAuthData()
      setUser(null)
      setAuthSource('none')
      
      toast.success('Вы вышли из системы')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      console.log('🔄 Обновление токена доступа...')
      
      const refreshTokenValue = autoAuthService.getRefreshToken()
      if (!refreshTokenValue) {
        throw new Error('No refresh token available')
      }

      const response = await authApi.refreshToken(refreshTokenValue)
      
      // Update tokens через autoAuthService
      localStorage.setItem('gongbu_access_token', response.accessToken)
      localStorage.setItem('gongbu_refresh_token', response.refreshToken)

      console.log('✅ Токен доступа обновлен')
    } catch (error) {
      console.error('❌ Ошибка обновления токена:', error)
      
      // Clear tokens and user state
      autoAuthService.clearAuthData()
      setUser(null)
      setAuthSource('none')
      
      throw error
    }
  }

  // Проверка роли пользователя
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false
    
    if (Array.isArray(role)) {
      return role.includes(user.role as UserRole)
    }
    
    return user.role === role
  }

  // Проверка, запущено ли приложение в Telegram WebApp
  const isTelegramWebApp = (): boolean => {
    return autoAuthService.isTelegramWebApp()
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    authSource,
    login,
    autoLogin,
    logout,
    refreshToken,
    hasRole,
    isTelegramWebApp,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
