import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline'
import { authApi } from '@/services/api'

const SystemStats: React.FC = () => {
  // Загружаем статистику пользователей
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => authApi.getUserStats(),
  })

  // Загружаем список пользователей для детальной статистики
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => authApi.getUsers({ page: 1, limit: 1000 }), // Получаем больше данных для статистики
  })

  if (statsLoading || usersLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
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

  // Вычисляем дополнительную статистику
  const totalUsers = userStats?.totalUsers || 0
  const activeUsers = userStats?.activeUsers || 0
  const newUsersToday = userStats?.newUsersToday || 0
  const bannedUsers = userStats?.usersByStatus?.BANNED || 0

  // Статистика по ролям
  const studentsCount = userStats?.usersByRole?.STUDENT || 0
  const creatorsCount = userStats?.usersByRole?.CREATOR || 0
  const adminsCount = userStats?.usersByRole?.ADMIN || 0

  // Статистика по подпискам
  const freeUsers = userStats?.usersBySubscription?.FREE || 0
  const premiumUsers = userStats?.usersBySubscription?.PREMIUM || 0
  const proUsers = userStats?.usersBySubscription?.PRO || 0

  // Вычисляем проценты
  const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
  const bannedPercentage = totalUsers > 0 ? Math.round((bannedUsers / totalUsers) * 100) : 0
  const studentsPercentage = totalUsers > 0 ? Math.round((studentsCount / totalUsers) * 100) : 0
  const creatorsPercentage = totalUsers > 0 ? Math.round((creatorsCount / totalUsers) * 100) : 0

  const mainStats = [
    {
      name: 'Всего пользователей',
      value: totalUsers.toLocaleString(),
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Активных пользователей',
      value: activeUsers.toLocaleString(),
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: `+${activePercentage}%`,
      changeType: 'positive',
    },
    {
      name: 'Новых сегодня',
      value: newUsersToday.toLocaleString(),
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '+5',
      changeType: 'positive',
    },
    {
      name: 'Заблокированных',
      value: bannedUsers.toLocaleString(),
      icon: XCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: `${bannedPercentage}%`,
      changeType: bannedPercentage > 5 ? 'negative' : 'neutral',
    },
  ]

  const roleStats = [
    {
      name: 'Студенты',
      value: studentsCount,
      percentage: studentsPercentage,
      color: 'bg-blue-500',
    },
    {
      name: 'Создатели курсов',
      value: creatorsCount,
      percentage: creatorsPercentage,
      color: 'bg-green-500',
    },
    {
      name: 'Администраторы',
      value: adminsCount,
      percentage: totalUsers > 0 ? Math.round((adminsCount / totalUsers) * 100) : 0,
      color: 'bg-purple-500',
    },
  ]

  const subscriptionStats = [
    {
      name: 'Бесплатный план',
      value: freeUsers,
      percentage: totalUsers > 0 ? Math.round((freeUsers / totalUsers) * 100) : 0,
      color: 'bg-gray-500',
    },
    {
      name: 'Премиум план',
      value: premiumUsers,
      percentage: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
      color: 'bg-yellow-500',
    },
    {
      name: 'Про план',
      value: proUsers,
      percentage: totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0,
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Системная статистика</h1>
        <p className="mt-1 text-sm text-gray-500">
          Детальная аналитика и метрики платформы
        </p>
      </div>

      {/* Основная статистика */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => (
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
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' :
                        stat.changeType === 'negative' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Статистика по ролям */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Распределение по ролям
          </h3>
          <div className="space-y-4">
            {roleStats.map((role) => (
              <div key={role.name}>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                  <span>{role.name}</span>
                  <span>{role.value} ({role.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${role.color}`}
                    style={{ width: `${role.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Статистика по подпискам */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Распределение по подпискам
          </h3>
          <div className="space-y-4">
            {subscriptionStats.map((subscription) => (
              <div key={subscription.name}>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                  <span>{subscription.name}</span>
                  <span>{subscription.value} ({subscription.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${subscription.color}`}
                    style={{ width: `${subscription.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Детальная статистика */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Статистика по статусам */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Статусы пользователей
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Активные</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {userStats?.usersByStatus?.ACTIVE || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Неактивные</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {userStats?.usersByStatus?.INACTIVE || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Заблокированные</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {userStats?.usersByStatus?.BANNED || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ключевые метрики */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Ключевые метрики
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Активность пользователей</span>
                <span className="text-sm font-medium text-gray-900">{activePercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Конверсия в создатели</span>
                <span className="text-sm font-medium text-gray-900">{creatorsPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Уровень блокировок</span>
                <span className="text-sm font-medium text-gray-900">{bannedPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Новые пользователи/день</span>
                <span className="text-sm font-medium text-gray-900">{newUsersToday}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Системная информация */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Системная информация
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalUsers > 0 ? Math.round(totalUsers / 100) * 100 : 0}
              </div>
              <div className="text-sm text-gray-500">Пользователей (округлено)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activeUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500">Активность</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {creatorsCount}
              </div>
              <div className="text-sm text-gray-500">Создателей контента</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemStats
