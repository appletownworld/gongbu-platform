import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: t('admin.dashboard'), href: '/admin', icon: HomeIcon },
    { name: t('admin.users'), href: '/admin/users', icon: UsersIcon },
    { name: t('admin.stats'), href: '/admin/stats', icon: ChartBarIcon },
    { name: t('admin.settings'), href: '/admin/settings', icon: CogIcon },
  ]

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="admin-layout">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user?.firstName?.[0] || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Администратор</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              {t('navigation.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
          </div>
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user?.firstName?.[0] || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Администратор</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              {t('navigation.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="admin-main-content">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-2">
                <span className="text-sm text-gray-500">Добро пожаловать,</span>
                <span className="text-sm font-medium text-gray-900">{user?.firstName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer - вынесен из контентной области с правильным позиционированием */}
      <footer className="bg-white border-t border-gray-200 lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
              <span className="ml-2 text-sm text-gray-600">Gongbu Admin Panel</span>
            </div>
            <div className="mt-2 sm:mt-0">
              <p className="text-xs text-gray-500">
                © 2024 Gongbu Platform. Все права защищены.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AdminLayout
