import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  ExclamationTriangleIcon, 
  ShieldExclamationIcon,
  ArrowLeftIcon,
  HomeIcon 
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'

const AccessDeniedPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const { message, requiredRole, requiredRoles, userRole } = location.state || {}

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      'STUDENT': 'Студент',
      'CREATOR': 'Создатель курсов', 
      'ADMIN': 'Администратор'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Icon and Title */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
            <ShieldExclamationIcon className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Доступ запрещен
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            У вас недостаточно прав для доступа к этой странице
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 space-y-4">
          
          {/* Current User Info */}
          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                👤 Ваш профиль
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  <span className="font-medium">Имя:</span> {user.firstName || user.username || 'Не указано'}
                </p>
                <p>
                  <span className="font-medium">Роль:</span> {getRoleDisplayName(user.role)}
                </p>
                <p>
                  <span className="font-medium">ID:</span> {user.id}
                </p>
              </div>
            </div>
          )}

          {/* Access Requirements */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              Требования доступа
            </h3>
            <div className="text-sm text-red-700">
              {message && <p className="mb-2">{message}</p>}
              
              {requiredRole && (
                <p>
                  <span className="font-medium">Требуется роль:</span> {getRoleDisplayName(requiredRole)}
                </p>
              )}
              
              {requiredRoles && requiredRoles.length > 0 && (
                <p>
                  <span className="font-medium">Требуется одна из ролей:</span>{' '}
                  {requiredRoles.map((role: string) => getRoleDisplayName(role)).join(', ')}
                </p>
              )}
              
              {userRole && (
                <p>
                  <span className="font-medium">Ваша роль:</span> {getRoleDisplayName(userRole)}
                </p>
              )}
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              💡 Нужны права доступа?
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              Если вы считаете, что это ошибка, или вам нужны дополнительные права:
            </p>
            <div className="space-y-2">
              <Link 
                to="/contact" 
                className="block text-sm text-yellow-800 hover:text-yellow-900 underline"
              >
                📧 Обратиться в поддержку
              </Link>
              <Link 
                to="/help/roles" 
                className="block text-sm text-yellow-800 hover:text-yellow-900 underline"
              >
                📖 Узнать о ролях пользователей
              </Link>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            
            {/* Go Back */}
            <button
              onClick={() => navigate(-1)}
              className="w-full btn-outline flex items-center justify-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Назад</span>
            </button>

            {/* Go Home */}
            <Link 
              to="/"
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <HomeIcon className="w-4 h-4" />
              <span>На главную</span>
            </Link>

            {/* Dashboard (if user has access) */}
            {user && (
              <Link 
                to="/dashboard"
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <span>🏠</span>
                <span>Мой кабинет</span>
              </Link>
            )}
          </div>

          {/* Logout Option */}
          <div className="pt-4 border-t border-secondary-200">
            <button
              onClick={handleLogout}
              className="w-full text-sm text-secondary-500 hover:text-secondary-700"
            >
              🚪 Выйти из аккаунта
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-primary-800 mb-2">
            🔒 Безопасность
          </h4>
          <p className="text-xs text-primary-700">
            Система контроля доступа защищает ваши данные и функции платформы. 
            Каждая роль имеет определенные права и ограничения.
          </p>
        </div>

        {/* Debug Info (only in development) */}
        {import.meta.env.DEV && (
          <details className="mt-6">
            <summary className="text-xs text-secondary-400 cursor-pointer">
              🔧 Debug Info (только в разработке)
            </summary>
            <pre className="mt-2 text-xs text-secondary-500 bg-secondary-100 p-2 rounded overflow-auto">
              {JSON.stringify({ 
                user: user ? { id: user.id, role: user.role } : null,
                requiredRole, 
                requiredRoles, 
                userRole,
                location: location.pathname
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export default AccessDeniedPage
