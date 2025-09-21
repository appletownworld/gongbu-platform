import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { authApi } from '@/services/api'
import { UserRole } from '@/types/auth'
import toast from 'react-hot-toast'

interface CreateFirstAdminProps {
  onSuccess?: () => void
}

const CreateFirstAdmin: React.FC<CreateFirstAdminProps> = ({ onSuccess }) => {
  const [telegramId, setTelegramId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [isChecking, setIsChecking] = useState(true)
  const [adminExists, setAdminExists] = useState(false)

  // Проверяем, существует ли уже администратор
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        // В режиме разработки проверяем localStorage
        if (import.meta.env.DEV) {
          const existingAdmin = localStorage.getItem('mockAdmin')
          if (existingAdmin) {
            setAdminExists(true)
            setIsChecking(false)
            return
          }
        }
        
        // В продакшне здесь был бы API вызов для проверки существования админа
        // const response = await authApi.checkAdminExists()
        // setAdminExists(response.exists)
        
        setIsChecking(false)
      } catch (error) {
        console.error('Ошибка при проверке существования администратора:', error)
        setIsChecking(false)
      }
    }

    checkAdminExists()
  }, [])

  // Мутация для создания первого админа
  const createAdminMutation = useMutation({
    mutationFn: async (adminData: {
      telegramId: number
      firstName: string
      lastName: string
      username?: string
    }) => {
      // Проверяем, не существует ли уже администратор
      if (import.meta.env.DEV) {
        const existingAdmin = localStorage.getItem('mockAdmin')
        if (existingAdmin) {
          throw new Error('Администратор уже существует! Создание дополнительных администраторов запрещено.')
        }
      }

      // Для демонстрации создаем mock администратора
      // В реальном приложении здесь должен быть API вызов
      const mockAdmin = {
        id: `admin_${Date.now()}`,
        telegramId: adminData.telegramId.toString(),
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        username: adminData.username,
        role: UserRole.ADMIN,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }

      // Имитируем задержку API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Сохраняем данные администратора в localStorage для демонстрации
      localStorage.setItem('mockAdmin', JSON.stringify(mockAdmin))
      
      return mockAdmin
    },
    onSuccess: () => {
      toast.success('Первый администратор создан успешно!')
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка при создании администратора')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!telegramId || !firstName || !lastName) {
      toast.error('Заполните все обязательные поля')
      return
    }

    const telegramIdNum = parseInt(telegramId)
    if (isNaN(telegramIdNum) || telegramIdNum <= 0) {
      toast.error('Введите корректный Telegram ID')
      return
    }

    createAdminMutation.mutate({
      telegramId: telegramIdNum,
      firstName,
      lastName,
      username: username || undefined,
    })
  }

  // Показываем загрузку при проверке существования администратора
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Проверка системы...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Если администратор уже существует, показываем сообщение
  if (adminExists) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Администратор уже создан
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                В системе уже существует администратор. Создание дополнительных администраторов запрещено.
              </p>
              <div className="mt-6">
                <a
                  href="/admin"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Перейти в админ панель
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ShieldCheckIcon className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Создание первого администратора
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Настройте первого администратора для управления платформой
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Предупреждение */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Важно
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Убедитесь, что у вас есть доступ к указанному Telegram аккаунту.
                    Этот аккаунт станет первым администратором платформы.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700">
                Telegram ID *
              </label>
              <div className="mt-1">
                <input
                  id="telegramId"
                  name="telegramId"
                  type="number"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="123456789"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Уникальный идентификатор пользователя в Telegram
              </p>
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Имя *
              </label>
              <div className="mt-1">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Иван"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Фамилия *
              </label>
              <div className="mt-1">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Иванов"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username (необязательно)
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="ivan_admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Без символа @
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={createAdminMutation.isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {createAdminMutation.isPending ? 'Создание...' : 'Создать администратора'}
              </button>
            </div>

            {/* Кнопка сброса для разработки */}
            {import.meta.env.DEV && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('mockAdmin')
                    window.location.reload()
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  🔄 Сбросить администратора (только для разработки)
                </button>
              </div>
            )}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Инструкция</span>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600">
              <h4 className="font-medium text-gray-900 mb-2">Как получить Telegram ID:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Напишите боту @userinfobot в Telegram</li>
                <li>Отправьте команду /start</li>
                <li>Скопируйте ваш ID из ответа бота</li>
                <li>Вставьте ID в поле выше</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateFirstAdmin
