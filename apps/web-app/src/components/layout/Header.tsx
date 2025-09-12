import React, { Fragment } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { clsx } from 'clsx'

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Главная', href: '/' },
    { name: 'Курсы', href: '/courses' },
    { name: 'О платформе', href: '/about' },
    { name: 'Контакты', href: '/contact' },
  ]

  const userNavigation = [
    { name: 'Панель управления', href: '/dashboard', icon: ChartBarIcon },
    { name: 'Мои курсы', href: '/my-courses', icon: BookOpenIcon },
    { name: 'Профиль', href: '/profile', icon: UserCircleIcon },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover-lift">
            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gradient">Gongbu</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  isActivePath(item.href)
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-secondary-600 hover:text-primary-600'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-100 transition-colors">
                  <UserCircleIcon className="h-8 w-8 text-secondary-500" />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-secondary-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-secondary-500 capitalize">
                      {user?.role.toLowerCase()}
                    </p>
                  </div>
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-secondary-200 focus:outline-none">
                    <div className="p-1">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <Link
                              to={item.href}
                              className={clsx(
                                'flex items-center space-x-3 px-4 py-2 text-sm rounded-md transition-colors',
                                active 
                                  ? 'bg-primary-50 text-primary-600' 
                                  : 'text-secondary-600 hover:bg-secondary-50'
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                      <hr className="my-1 border-secondary-200" />
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={clsx(
                              'flex items-center space-x-3 px-4 py-2 text-sm rounded-md transition-colors w-full text-left',
                              active 
                                ? 'bg-error-50 text-error-600' 
                                : 'text-secondary-600 hover:bg-secondary-50'
                            )}
                          >
                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                            <span>Выйти</span>
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="btn-ghost"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Регистрация
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6 text-secondary-600" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-secondary-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-secondary-200 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'block px-4 py-3 text-base font-medium transition-colors',
                    isActivePath(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAuthenticated && (
                <>
                  <hr className="my-2 border-secondary-200" />
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-secondary-600 hover:bg-secondary-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-error-600 hover:bg-error-50 transition-colors w-full text-left"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Выйти</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
