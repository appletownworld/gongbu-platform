import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  fallbackPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles = [],
  fallbackPath = '/auth/login'
}) => {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="text-secondary-600">
            <p className="text-lg font-medium">Проверяем авторизацию...</p>
            <p className="text-sm">Подождите немного</p>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Check role requirements
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate 
        to="/access-denied" 
        state={{ 
          message: `Требуется роль: ${requiredRole}. У вас: ${user.role}`,
          requiredRole,
          userRole: user.role
        }} 
        replace 
      />
    )
  }

  // Check multiple roles
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
    return (
      <Navigate 
        to="/access-denied" 
        state={{ 
          message: `Требуется одна из ролей: ${requiredRoles.join(', ')}. У вас: ${user.role}`,
          requiredRoles,
          userRole: user.role
        }} 
        replace 
      />
    )
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}

// Специализированные компоненты для разных ролей
export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={[UserRole.STUDENT, UserRole.CREATOR, UserRole.ADMIN]}>
    {children}
  </ProtectedRoute>
)

export const CreatorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={[UserRole.CREATOR, UserRole.ADMIN]}>
    {children}
  </ProtectedRoute>
)

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole={UserRole.ADMIN}>
    {children}
  </ProtectedRoute>
)

export default ProtectedRoute
