import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

const ProfilePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-custom py-8">
        <div className="card max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-secondary-900 mb-6">Профиль</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Имя
              </label>
              <p className="text-secondary-900">{user?.firstName} {user?.lastName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Username
              </label>
              <p className="text-secondary-900">@{user?.username || 'Не указан'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Роль
              </label>
              <p className="text-secondary-900">{user?.role}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Подписка
              </label>
              <span className="badge-primary">{user?.subscriptionPlan || 'Базовая'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
