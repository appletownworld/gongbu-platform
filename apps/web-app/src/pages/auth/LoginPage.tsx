import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AcademicCapIcon, EyeIcon, EyeSlashIcon, MessageCircle, Zap, Shield, ArrowRight, CheckCircle, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const LoginPage: React.FC = () => {
  const { login, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [formData, setFormData] = useState({
    initData: '',
    remember: false,
  })
  const [showInitData, setShowInitData] = useState(false)
  const [showTechnicalLogin, setShowTechnicalLogin] = useState(false)
  const [isInTelegram, setIsInTelegram] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  // Проверяем, запущены ли мы из Telegram WebApp
  useEffect(() => {
    const checkTelegramEnvironment = () => {
      // @ts-ignore
      return !!(window.Telegram && window.Telegram.WebApp)
    }
    
    setIsInTelegram(checkTelegramEnvironment())
    
    // Если пользователь уже авторизован, перенаправляем его
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

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

  // Если пользователь запустил страницу в Telegram WebApp
  if (isInTelegram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900 py-16 flex items-center justify-center">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-secondary-200 text-center animate-fade-in">
            <MessageCircle className="h-16 w-16 text-primary-500 mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary-700 mb-6 leading-tight">
              Добро пожаловать в Gongbu!
            </h1>
            <p className="text-lg text-secondary-700 mb-8">
              Вы запустили приложение через Telegram WebApp. Авторизация произойдет автоматически.
            </p>
            
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Zap className="h-6 w-6 text-primary-600" />
                <h3 className="font-semibold text-primary-800">Автоматический вход</h3>
              </div>
              <p className="text-sm text-primary-700">
                Система использует данные вашего Telegram аккаунта для безопасной авторизации. 
                Никаких дополнительных действий не требуется.
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center space-x-3 text-primary-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="font-medium">Выполняется вход...</span>
              </div>
            ) : (
              <div className="text-secondary-600">
                <p className="mb-4">Если авторизация не началась автоматически:</p>
                <button
                  onClick={() => setShowTechnicalLogin(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  Показать техническую форму входа
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900 py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <AcademicCapIcon className="h-12 w-12 text-primary-600" />
            <span className="text-2xl font-bold text-gradient">Gongbu</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary-700 mb-6 leading-tight animate-fade-in-down">
            Вход в систему
          </h1>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto">
            Для входа в Gongbu используется безопасная авторизация через Telegram
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* How to Login Section */}
          <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-secondary-200 animate-fade-in-left">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-800 mb-8">Как войти в Gongbu?</h2>
            <ol className="list-decimal list-inside text-secondary-600 space-y-4 text-lg mb-8">
              <li className="flex items-start">
                <span className="mr-3">1.</span>
                <div>
                  <strong className="text-secondary-800">Найдите нашего бота в Telegram:</strong>
                  <br />
                  <a href="https://t.me/at_gongbubot" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">
                    @at_gongbubot
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3">2.</span>
                <div>
                  <strong className="text-secondary-800">Запустите бота командой:</strong>
                  <br />
                  <code className="bg-secondary-100 px-2 py-1 rounded text-sm">/start</code> или <code className="bg-secondary-100 px-2 py-1 rounded text-sm">/courses</code>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3">3.</span>
                <div>
                  <strong className="text-secondary-800">Нажмите кнопку</strong>
                  <br />
                  <span className="inline-flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium mt-1">
                    🚀 Начать изучение
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3">4.</span>
                <div>
                  <strong className="text-secondary-800">Готово!</strong>
                  <br />
                  Вы автоматически войдете в систему
                </div>
              </li>
            </ol>

            <a
              href="https://t.me/at_gongbubot"
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Перейти к Telegram боту <ArrowRight className="ml-3 h-5 w-5" />
            </a>
          </div>

          {/* Benefits Section */}
          <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-secondary-200 animate-fade-in-right">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-800 mb-8">Преимущества входа через Telegram</h2>
            <div className="space-y-6">
              {[
                { icon: Zap, title: "Мгновенно", description: "Авторизация за менее чем 1 секунду без форм и паролей" },
                { icon: Shield, title: "Безопасно", description: "Используем официальный Telegram WebApp API для защиты данных" },
                { icon: CheckCircle, title: "Просто", description: "Один клик в Telegram — и вы уже в системе обучения" },
                { icon: MessageCircle, title: "Удобно", description: "Все уведомления и материалы прямо в Telegram" }
              ].map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <benefit.icon className="w-8 h-8 text-primary-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">{benefit.title}</h3>
                    <p className="text-secondary-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Login Section (Hidden by default) */}
        {showTechnicalLogin && (
          <div className="bg-white rounded-xl shadow-lg border border-warning-200 p-8 mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />
              <h3 className="text-xl font-bold text-warning-800">Техническая форма входа</h3>
            </div>
            <p className="text-sm text-warning-700 mb-6">
              ⚠️ Используйте эту форму только если автоматический вход не работает. В обычных условиях авторизация происходит автоматически через Telegram WebApp.
            </p>
            
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
              </div>

              {/* Development Helper */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  🔧 Для разработчиков
                </h4>
                <p className="text-xs text-blue-700 mb-3">
                  В production данные передаются автоматически от Telegram WebApp
                </p>
                <button
                  type="button"
                  onClick={generateMockInitData}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Сгенерировать тестовые данные
                </button>
              </div>

              <div className="flex items-center justify-between">
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

                <button
                  type="button"
                  onClick={() => setShowTechnicalLogin(false)}
                  className="text-sm text-secondary-500 hover:text-secondary-700"
                >
                  Скрыть техническую форму
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Авторизация...</span>
                  </div>
                ) : (
                  'Войти через техническую форму'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Show Technical Login Button */}
        {!showTechnicalLogin && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowTechnicalLogin(true)}
              className="text-sm text-secondary-500 hover:text-secondary-700 underline"
            >
              Возникли проблемы с автоматическим входом?
            </button>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-secondary-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-secondary-800 mb-6 text-center">Часто задаваемые вопросы</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-secondary-100">
              <h3 className="font-semibold text-secondary-700 mb-2">🤔 Почему нет обычного входа по email/паролю?</h3>
              <p className="text-secondary-600">
                Мы используем Telegram для максимальной безопасности и удобства. Это избавляет от необходимости запоминать пароли и защищает от взлома аккаунтов.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-secondary-100">
              <h3 className="font-semibold text-secondary-700 mb-2">🔒 Насколько это безопасно?</h3>
              <p className="text-secondary-600">
                Авторизация происходит через официальный Telegram WebApp API, который обеспечивает банковский уровень безопасности ваших данных.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-secondary-100">
              <h3 className="font-semibold text-secondary-700 mb-2">📱 Что если у меня нет Telegram?</h3>
              <p className="text-secondary-600">
                Telegram — это бесплатный мессенджер, доступный на всех платформах. <a href="https://telegram.org/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Скачайте его здесь</a> и зарегистрируйтесь за 1 минуту.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Links */}
        <div className="text-center space-y-4 mt-8">
          <p className="text-sm text-secondary-600">
            Нужна помощь? <Link to="/contact" className="text-primary-600 hover:underline">Свяжитесь с нами</Link>
          </p>
          <Link to="/" className="text-secondary-500 hover:text-secondary-700 text-sm">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
