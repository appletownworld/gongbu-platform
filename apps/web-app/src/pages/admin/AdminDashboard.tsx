import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { authApi } from '@/services/api'

const AdminDashboard: React.FC = () => {
  // Загружаем статистику пользователей
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => authApi.getUserStats(),
  })

  // Загружаем список пользователей для быстрого обзора
  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: () => authApi.getUsers({ page: 1, limit: 5 }),
  })

  const stats = [
    {
      name: 'Всего пользователей',
      value: userStats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Активных пользователей',
      value: userStats?.activeUsers || 0,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Новых сегодня',
      value: userStats?.newUsersToday || 0,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Заблокированных',
      value: userStats?.usersByStatus?.BANNED || 0,
      icon: XCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  const quickActions = [
    {
      name: 'Управление пользователями',
      description: 'Просмотр, редактирование и блокировка пользователей',
      href: '/admin/users',
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Системная статистика',
      description: 'Детальная аналитика и метрики платформы',
      href: '/admin/stats',
      icon: ChartBarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Настройки системы',
      description: 'Конфигурация платформы и системные параметры',
      href: '/admin/settings',
      icon: ExclamationTriangleIcon,
      color: 'bg-purple-500',
    },
  ]

  if (statsLoading || usersLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
        <p className="mt-1 text-sm text-gray-500">
          Обзор системы и быстрый доступ к основным функциям
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Быстрые действия */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ${action.color} text-white`}>
                  <action.icon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                aria-hidden="true"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Статистика по ролям */}
      {userStats?.usersByRole && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Пользователи по ролям</h2>
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userStats.usersByRole.STUDENT || 0}
                  </div>
                  <div className="text-sm text-gray-500">Студенты</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userStats.usersByRole.CREATOR || 0}
                  </div>
                  <div className="text-sm text-gray-500">Создатели курсов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {userStats.usersByRole.ADMIN || 0}
                  </div>
                  <div className="text-sm text-gray-500">Администраторы</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Последние пользователи */}
      {recentUsers?.users && recentUsers.users.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Последние пользователи</h2>
            <Link
              to="/admin/users"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Посмотреть всех
            </Link>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {recentUsers.users.map((user: any) => (
                <li key={user.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.firstName?.[0] || user.username?.[0] || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username || 'без username'} • {user.role}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'BANNED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status === 'ACTIVE' ? 'Активен' : 
                         user.status === 'BANNED' ? 'Заблокирован' : 'Неактивен'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
