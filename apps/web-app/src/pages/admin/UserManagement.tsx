import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { authApi } from '@/services/api'
import { UserRole, UserStatus } from '@/types/auth'
import toast from 'react-hot-toast'

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserModal, setShowUserModal] = useState(false)

  const limit = 20

  // Загружаем пользователей
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', currentPage, searchTerm, roleFilter, statusFilter],
    queryFn: () => authApi.getUsers({
      page: currentPage,
      limit,
      search: searchTerm || undefined,
      role: roleFilter || undefined,
    }),
  })

  // Мутация для изменения роли пользователя
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      authApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
      toast.success('Роль пользователя обновлена')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка при обновлении роли')
    },
  })

  // Мутация для блокировки пользователя
  const banUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      authApi.banUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
      toast.success('Пользователь заблокирован')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка при блокировке пользователя')
    },
  })

  // Мутация для разблокировки пользователя
  const unbanUserMutation = useMutation({
    mutationFn: (userId: string) => authApi.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
      toast.success('Пользователь разблокирован')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка при разблокировке пользователя')
    },
  })

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateRoleMutation.mutate({ userId, role: newRole })
  }

  const handleBanUser = (userId: string) => {
    const reason = prompt('Причина блокировки (необязательно):')
    banUserMutation.mutate({ userId, reason: reason || undefined })
  }

  const handleUnbanUser = (userId: string) => {
    if (confirm('Разблокировать пользователя?')) {
      unbanUserMutation.mutate(userId)
    }
  }

  const handleViewUser = (user: any) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800'
      case UserRole.CREATOR:
        return 'bg-green-100 text-green-800'
      case UserRole.STUDENT:
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'bg-green-100 text-green-800'
      case UserStatus.BANNED:
        return 'bg-red-100 text-red-800'
      case UserStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Активен'
      case UserStatus.BANNED:
        return 'Заблокирован'
      case UserStatus.INACTIVE:
        return 'Неактивен'
      default:
        return 'Неизвестно'
    }
  }

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Администратор'
      case UserRole.CREATOR:
        return 'Создатель курсов'
      case UserRole.STUDENT:
        return 'Студент'
      default:
        return 'Неизвестно'
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
        <p className="mt-1 text-sm text-gray-500">
          Просмотр, редактирование и управление пользователями платформы
        </p>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Поиск */}
          <div className="sm:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Поиск пользователей
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Имя, username или email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Фильтр по роли */}
          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
              Роль
            </label>
            <select
              id="role-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            >
              <option value="">Все роли</option>
              <option value={UserRole.STUDENT}>Студенты</option>
              <option value={UserRole.CREATOR}>Создатели курсов</option>
              <option value={UserRole.ADMIN}>Администраторы</option>
            </select>
          </div>

          {/* Фильтр по статусу */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Статус
            </label>
            <select
              id="status-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
            >
              <option value="">Все статусы</option>
              <option value={UserStatus.ACTIVE}>Активные</option>
              <option value={UserStatus.INACTIVE}>Неактивные</option>
              <option value={UserStatus.BANNED}>Заблокированные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица пользователей */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-500">Загрузка пользователей...</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {usersData?.users.map((user: any) => (
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
                          @{user.username || 'без username'} • ID: {user.telegramId}
                        </div>
                        {user.email && (
                          <div className="text-sm text-gray-500">{user.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Статус */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                        {getStatusText(user.status)}
                      </span>

                      {/* Роль */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>

                      {/* Действия */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Просмотр"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>

                        {user.role !== UserRole.ADMIN && (
                          <>
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              disabled={updateRoleMutation.isPending}
                            >
                              <option value={UserRole.STUDENT}>Студент</option>
                              <option value={UserRole.CREATOR}>Создатель</option>
                              <option value={UserRole.ADMIN}>Админ</option>
                            </select>

                            {user.status === UserStatus.BANNED ? (
                              <button
                                onClick={() => handleUnbanUser(user.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Разблокировать"
                                disabled={unbanUserMutation.isPending}
                              >
                                <ShieldCheckIcon className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(user.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Заблокировать"
                                disabled={banUserMutation.isPending}
                              >
                                <ShieldExclamationIcon className="h-5 w-5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Пагинация */}
            {usersData && usersData.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Предыдущая
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(usersData.pages, currentPage + 1))}
                    disabled={currentPage === usersData.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Следующая
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Показано{' '}
                      <span className="font-medium">{(currentPage - 1) * limit + 1}</span>
                      {' '}до{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * limit, usersData.total)}
                      </span>
                      {' '}из{' '}
                      <span className="font-medium">{usersData.total}</span>
                      {' '}результатов
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Предыдущая
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(usersData.pages, currentPage + 1))}
                        disabled={currentPage === usersData.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Следующая
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно просмотра пользователя */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUserModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Информация о пользователе</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Имя</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="mt-1 text-sm text-gray-900">@{selectedUser.username || 'не указан'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telegram ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.telegramId}</p>
                  </div>
                  {selectedUser.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Роль</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                      {getRoleText(selectedUser.role)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Статус</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedUser.status)}`}>
                      {getStatusText(selectedUser.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Дата регистрации</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  {selectedUser.lastLoginAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Последний вход</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedUser.lastLoginAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
