import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'
import AccessDeniedPage from '@/pages/auth/AccessDeniedPage'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth()

  // Показываем загрузку пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Проверяем права доступа...</p>
        </div>
      </div>
    )
  }

  // Если не авторизован - перенаправляем на главную
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Если авторизован, но не админ - показываем страницу отказа в доступе
  if (!user || user.role !== UserRole.ADMIN) {
    return <AccessDeniedPage />
  }

  // Если админ - показываем содержимое
  return <>{children}</>
}

export default AdminRoute
