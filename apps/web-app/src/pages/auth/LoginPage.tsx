import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AcademicCapIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [formData, setFormData] = useState({
    initData: '',
    remember: false,
  })
  const [showInitData, setShowInitData] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.initData.trim()) {
      toast.error('Введите данные от Telegram WebApp')
      return
    }

    try {
      await login(formData.initData)
      navigate(from, { replace: true })
    } catch (error) {
      // Error is handled in AuthContext
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Mock Telegram WebApp data for development
  const generateMockInitData = () => {
    const mockUser = {
      id: Date.now(),
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru'
    }
    
    const mockInitData = `user=${encodeURIComponent(JSON.stringify(mockUser))}&auth_date=${Math.floor(Date.now() / 1000)}&hash=mock_hash_for_development`
    
    setFormData(prev => ({
      ...prev,
      initData: mockInitData
    }))
    
    toast.success('Сгенерированы тестовые данные Telegram WebApp')
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <AcademicCapIcon className="h-12 w-12 text-primary-600" />
            <span className="text-2xl font-bold text-gradient">Gongbu</span>
          </Link>
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            Вход в систему
          </h2>
          <p className="text-secondary-600">
            Войдите через Telegram WebApp для доступа к курсам
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Telegram Init Data */}
            <div>
              <label htmlFor="initData" className="block text-sm font-medium text-secondary-700 mb-2">
                Данные от Telegram WebApp
              </label>
              <div className="relative">
                <input
                  id="initData"
                  name="initData"
                  type={showInitData ? 'text' : 'password'}
                  value={formData.initData}
                  onChange={handleChange}
                  placeholder="user=%7B%22id%22%3A..."
                  className="input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowInitData(!showInitData)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  {showInitData ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-secondary-500 mt-1">
                Данные передаются автоматически при запуске из Telegram WebApp
              </p>
            </div>

            {/* Development Helper */}
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-warning-800 mb-2">
                🔧 Для разработки
              </h4>
              <p className="text-xs text-warning-700 mb-3">
                В продакшене данные будут передаваться автоматически от Telegram WebApp
              </p>
              <button
                type="button"
                onClick={generateMockInitData}
                className="text-xs btn-warning"
              >
                Сгенерировать тестовые данные
              </button>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-secondary-700">
                Запомнить меня
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner"></div>
                  <span>Вход...</span>
                </div>
              ) : (
                'Войти через Telegram'
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-secondary-200">
            <div className="text-center space-y-4">
              <p className="text-sm text-secondary-600">
                Нет аккаунта? Он будет создан автоматически при первом входе
              </p>
              
              <div className="space-y-2">
                <Link 
                  to="/help/telegram-webapp" 
                  className="block text-sm text-primary-600 hover:text-primary-700"
                >
                  Как получить данные Telegram WebApp?
                </Link>
                <Link 
                  to="/contact" 
                  className="block text-sm text-secondary-500 hover:text-secondary-700"
                >
                  Нужна помощь с входом?
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-primary-800 mb-2">
            🔒 Безопасность
          </h4>
          <p className="text-xs text-primary-700">
            Мы используем Telegram WebApp для безопасной аутентификации. 
            Ваши данные защищены и не передаются третьим лицам.
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link to="/" className="text-secondary-500 hover:text-secondary-700 text-sm">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
