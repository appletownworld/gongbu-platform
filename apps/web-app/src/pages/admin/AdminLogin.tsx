import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const AdminLogin: React.FC = () => {
  const { user, isLoading, isAuthenticated, loadMockAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Если пользователь уже авторизован как администратор, перенаправляем в админ панель
    if (isAuthenticated && user?.role === 'ADMIN') {
      navigate('/admin')
      return
    }

    // Если пользователь авторизован, но не администратор
    if (isAuthenticated && user?.role !== 'ADMIN') {
      toast.error('У вас нет прав администратора')
      navigate('/')
      return
    }
  }, [isAuthenticated, user, navigate])

  const handleLoginAsAdmin = () => {
    // В режиме разработки проверяем mock данные
    if (import.meta.env.DEV) {
      const mockAdmin = localStorage.getItem('mockAdmin')
      if (mockAdmin) {
        loadMockAdmin()
        navigate('/admin')
        return
      }
    }
    
    toast.error('Администратор не найден. Создайте администратора сначала.')
    navigate('/admin/setup')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка...</p>
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
          <ShieldCheckIcon className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Вход в админ панель
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Войдите в систему как администратор
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <button
                onClick={handleLoginAsAdmin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Войти как администратор
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Нет администратора?{' '}
                <a
                  href="/admin/setup"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Создать администратора
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
