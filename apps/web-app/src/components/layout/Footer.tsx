import React from 'react'
import { Link } from 'react-router-dom'
import { AcademicCapIcon } from '@heroicons/react/24/outline'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    platform: [
      { name: 'О платформе', href: '/about' },
      { name: 'Как это работает', href: '/how-it-works' },
      { name: 'Цены', href: '/pricing' },
      { name: 'FAQ', href: '/faq' },
    ],
    learning: [
      { name: 'Все курсы', href: '/courses' },
      { name: 'Категории', href: '/categories' },
      { name: 'Преподаватели', href: '/instructors' },
      { name: 'Сертификаты', href: '/certificates' },
    ],
    support: [
      { name: 'Центр помощи', href: '/help' },
      { name: 'Контакты', href: '/contact' },
      { name: 'Сообщить о проблеме', href: '/report' },
      { name: 'Статус системы', href: '/status' },
    ],
    legal: [
      { name: 'Политика конфиденциальности', href: '/privacy' },
      { name: 'Условия использования', href: '/terms' },
      { name: 'Пользовательское соглашение', href: '/agreement' },
      { name: 'Cookies', href: '/cookies' },
    ],
  }

  const socialLinks = [
    { name: 'Telegram', href: 'https://t.me/gongbu_platform', icon: '📱' },
    { name: 'YouTube', href: '#', icon: '📺' },
    { name: 'GitHub', href: 'https://github.com/gongbu-platform', icon: '💻' },
    { name: 'Twitter', href: '#', icon: '🐦' },
  ]

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container-custom">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Logo and Description */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <AcademicCapIcon className="h-8 w-8 text-primary-400" />
                <span className="text-xl font-bold">Gongbu</span>
              </Link>
              <p className="text-secondary-300 text-sm leading-relaxed mb-6">
                Современная образовательная платформа для изучения программирования, 
                дизайна и других IT-навыков. Учитесь в удобном темпе с лучшими преподавателями.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-400 hover:text-white transition-colors text-xl"
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Платформа</h3>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-secondary-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learning Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Обучение</h3>
              <ul className="space-y-3">
                {footerLinks.learning.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-secondary-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Поддержка</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-secondary-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Правовая информация</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-secondary-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="border-t border-secondary-800 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Подпишитесь на новости
              </h3>
              <p className="text-secondary-300 text-sm">
                Получайте уведомления о новых курсах, акциях и обновлениях платформы
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Ваш email"
                className="flex-1 px-4 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button className="btn-primary whitespace-nowrap">
                Подписаться
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-secondary-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-secondary-400 text-sm">
              © {currentYear} Gongbu Platform. Все права защищены.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-secondary-400">
              <span>Сделано с ❤️ для образования</span>
              <div className="flex items-center space-x-2">
                <span>Версия:</span>
                <span className="px-2 py-1 bg-secondary-800 rounded text-xs font-mono">
                  v1.0.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
