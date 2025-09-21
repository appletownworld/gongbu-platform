import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon,
  KeyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'

const SystemSettings: React.FC = () => {
  const queryClient = useQueryClient()
  const [serviceTokenName, setServiceTokenName] = useState('')
  const [serviceTokenPermissions, setServiceTokenPermissions] = useState<string[]>([])

  // Мутация для генерации сервисного токена
  const generateTokenMutation = useMutation({
    mutationFn: ({ serviceName, permissions }: { serviceName: string; permissions: string[] }) =>
      authApi.generateServiceToken(serviceName, permissions),
    onSuccess: (data) => {
      toast.success('Сервисный токен создан')
      // Показываем токен пользователю (в реальном приложении это должно быть более безопасно)
      navigator.clipboard.writeText(data.token)
      toast.success('Токен скопирован в буфер обмена')
      setServiceTokenName('')
      setServiceTokenPermissions([])
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка при создании токена')
    },
  })

  // Мутация для очистки истекших сессий
  const cleanupSessionsMutation = useMutation({
    mutationFn: () => authApi.cleanupExpiredSessions(),
    onSuccess: (data) => {
      toast.success(`Очищено ${data.deletedSessions} истекших сессий`)
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка при очистке сессий')
    },
  })

  const availablePermissions = [
    'user:read',
    'user:write',
    'course:read',
    'course:write',
    'analytics:read',
    'system:admin',
  ]

  const handlePermissionToggle = (permission: string) => {
    setServiceTokenPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }

  const handleGenerateToken = () => {
    if (!serviceTokenName.trim()) {
      toast.error('Введите название сервиса')
      return
    }
    if (serviceTokenPermissions.length === 0) {
      toast.error('Выберите хотя бы одно разрешение')
      return
    }

    generateTokenMutation.mutate({
      serviceName: serviceTokenName,
      permissions: serviceTokenPermissions,
    })
  }

  const handleCleanupSessions = () => {
    if (confirm('Очистить все истекшие сессии? Это действие нельзя отменить.')) {
      cleanupSessionsMutation.mutate()
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки системы</h1>
        <p className="mt-1 text-sm text-gray-500">
          Управление системными параметрами и безопасностью
        </p>
      </div>

      {/* Генерация сервисных токенов */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <KeyIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Сервисные токены
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Создайте токены для интеграции с внешними сервисами
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="service-name" className="block text-sm font-medium text-gray-700">
                Название сервиса
              </label>
              <input
                type="text"
                id="service-name"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Например: Analytics Service"
                value={serviceTokenName}
                onChange={(e) => setServiceTokenName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Разрешения
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availablePermissions.map((permission) => (
                  <label key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={serviceTokenPermissions.includes(permission)}
                      onChange={() => handlePermissionToggle(permission)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateToken}
              disabled={generateTokenMutation.isPending}
              className="btn-primary"
            >
              {generateTokenMutation.isPending ? 'Создание...' : 'Создать токен'}
            </button>
          </div>
        </div>
      </div>

      {/* Управление сессиями */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Управление сессиями
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Очистка истекших сессий для освобождения ресурсов
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Внимание
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Очистка истекших сессий удалит все неактивные сессии пользователей.
                    Это действие нельзя отменить.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCleanupSessions}
            disabled={cleanupSessionsMutation.isPending}
            className="btn-warning"
          >
            {cleanupSessionsMutation.isPending ? 'Очистка...' : 'Очистить истекшие сессии'}
          </button>
        </div>
      </div>

      {/* Системная информация */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <CogIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Системная информация
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Версия платформы</dt>
              <dd className="mt-1 text-sm text-gray-900">1.0.0</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Время работы</dt>
              <dd className="mt-1 text-sm text-gray-900">24/7</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Статус системы</dt>
              <dd className="mt-1 flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Работает нормально</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Последнее обновление</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date().toLocaleDateString('ru-RU')}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Рекомендации по безопасности */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Рекомендации по безопасности
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Регулярная очистка сессий</h4>
                <p className="text-sm text-gray-500">
                  Рекомендуется очищать истекшие сессии еженедельно для поддержания безопасности.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Ограниченные сервисные токены</h4>
                <p className="text-sm text-gray-500">
                  Создавайте токены только с необходимыми разрешениями для минимизации рисков.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Мониторинг активности</h4>
                <p className="text-sm text-gray-500">
                  Регулярно проверяйте статистику пользователей на предмет подозрительной активности.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings
