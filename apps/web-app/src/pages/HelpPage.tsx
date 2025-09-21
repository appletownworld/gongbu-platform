import React from 'react';
import { Link } from 'react-router-dom';
import { 
  QuestionMarkCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const HelpPage: React.FC = () => {
  const helpCategories = [
    {
      title: "Getting Started",
      description: "Как начать обучение на платформе",
      icon: AcademicCapIcon,
      color: "bg-blue-500",
      articles: [
        { title: "Регистрация через Telegram", link: "/faq#registration" },
        { title: "Как выбрать первый курс", link: "/faq#first-course" },
        { title: "Навигация по платформе", link: "/faq#navigation" },
        { title: "Настройка профиля", link: "/faq#profile-setup" }
      ]
    },
    {
      title: "Курсы и обучение",
      description: "Вопросы по курсам и процессу обучения",
      icon: BookOpenIcon,
      color: "bg-green-500",
      articles: [
        { title: "Как проходить уроки", link: "/faq#lessons" },
        { title: "Выполнение домашних заданий", link: "/faq#homework" },
        { title: "Отслеживание прогресса", link: "/faq#progress" },
        { title: "Получение сертификатов", link: "/faq#certificates" }
      ]
    },
    {
      title: "Оплата и подписки",
      description: "Вопросы по оплате и управлению подпиской",
      icon: CreditCardIcon,
      color: "bg-purple-500",
      articles: [
        { title: "Способы оплаты", link: "/faq#payment-methods" },
        { title: "Смена тарифного плана", link: "/faq#plan-change" },
        { title: "Возврат средств", link: "/faq#refund" },
        { title: "Скидки и промокоды", link: "/faq#discounts" }
      ]
    },
    {
      title: "Техническая поддержка",
      description: "Решение технических проблем",
      icon: Cog6ToothIcon,
      color: "bg-red-500",
      articles: [
        { title: "Проблемы с видео", link: "/faq#video-issues" },
        { title: "Не загружается страница", link: "/faq#loading-issues" },
        { title: "Проблемы с авторизацией", link: "/faq#auth-issues" },
        { title: "Мобильная версия", link: "/faq#mobile" }
      ]
    },
    {
      title: "Telegram интеграция",
      description: "Особенности работы через Telegram",
      icon: ChatBubbleLeftEllipsisIcon,
      color: "bg-cyan-500",
      articles: [
        { title: "Настройка уведомлений", link: "/faq#notifications" },
        { title: "Команды бота", link: "/faq#bot-commands" },
        { title: "WebApp не открывается", link: "/faq#webapp-issues" },
        { title: "Конфиденциальность в Telegram", link: "/faq#telegram-privacy" }
      ]
    },
    {
      title: "Общие вопросы",
      description: "Часто задаваемые вопросы",
      icon: QuestionMarkCircleIcon,
      color: "bg-orange-500",
      articles: [
        { title: "Что такое Gongbu?", link: "/faq#what-is-gongbu" },
        { title: "Системные требования", link: "/faq#requirements" },
        { title: "Политика конфиденциальности", link: "/privacy" },
        { title: "Условия использования", link: "/terms" }
      ]
    }
  ];

  const quickActions = [
    {
      title: "Написать в поддержку",
      description: "Получите персональную помощь от нашей команды",
      icon: EnvelopeIcon,
      action: "mailto:support@gongbu.appletownworld.com",
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Telegram бот",
      description: "Задайте вопрос прямо в Telegram",
      icon: ChatBubbleLeftEllipsisIcon,
      action: "https://t.me/at_gongbubot",
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "Часто задаваемые вопросы",
      description: "Найдите ответы на популярные вопросы",
      icon: QuestionMarkCircleIcon,
      action: "/faq",
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Статус системы",
      description: "Проверьте работоспособность сервисов",
      icon: Cog6ToothIcon,
      action: "/status",
      color: "bg-orange-600 hover:bg-orange-700"
    }
  ];

  const handleAction = (action: string) => {
    if (action.startsWith('http') || action.startsWith('mailto:')) {
      window.open(action, '_blank');
    } else {
      window.location.href = action;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <QuestionMarkCircleIcon className="h-12 w-12 text-primary-600 mr-4" />
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700">
              Центр <span className="text-accent-500">помощи</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto">
            Найдите ответы на ваши вопросы или свяжитесь с нашей службой поддержки для получения персональной помощи.
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Поиск по справке..."
              className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 mb-12">
            Нужна помощь прямо сейчас?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action.action)}
                className={`${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-left`}
              >
                <action.icon className="h-8 w-8 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 mb-12">
            Популярные разделы справки
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {helpCategories.map((category, index) => (
              <div
                key={index}
                className="bg-white border border-secondary-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-secondary-100">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${category.color} bg-opacity-10 mr-4`}>
                      <category.icon className={`h-6 w-6 ${category.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-800">{category.title}</h3>
                    </div>
                  </div>
                  <p className="text-secondary-600">{category.description}</p>
                </div>

                {/* Articles */}
                <div className="p-6">
                  <ul className="space-y-3">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <Link
                          to={article.link}
                          className="flex items-center text-secondary-600 hover:text-primary-600 transition-colors duration-200 group"
                        >
                          <ArrowRightIcon className="h-4 w-4 mr-3 group-hover:translate-x-1 transition-transform duration-200" />
                          {article.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 md:py-24 bg-primary-700 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Не нашли ответ?
          </h2>
          <p className="text-lg text-primary-200 mb-8">
            Наша команда поддержки готова помочь вам 24/7. Мы отвечаем на большинство обращений в течение 2-3 часов.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-primary-800 rounded-lg p-6">
              <EnvelopeIcon className="h-8 w-8 mx-auto mb-4 text-primary-200" />
              <h3 className="font-semibold mb-2">Email поддержка</h3>
              <p className="text-sm text-primary-200 mb-4">Подробное описание проблемы</p>
              <a
                href="mailto:support@gongbu.appletownworld.com"
                className="text-white bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Написать письмо
              </a>
            </div>
            
            <div className="bg-primary-800 rounded-lg p-6">
              <ChatBubbleLeftEllipsisIcon className="h-8 w-8 mx-auto mb-4 text-primary-200" />
              <h3 className="font-semibold mb-2">Telegram бот</h3>
              <p className="text-sm text-primary-200 mb-4">Быстрый ответ в чате</p>
              <a
                href="https://t.me/at_gongbubot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Открыть бота
              </a>
            </div>
            
            <div className="bg-primary-800 rounded-lg p-6">
              <PhoneIcon className="h-8 w-8 mx-auto mb-4 text-primary-200" />
              <h3 className="font-semibold mb-2">Форма обратной связи</h3>
              <p className="text-sm text-primary-200 mb-4">Удобная веб-форма</p>
              <Link
                to="/contact"
                className="text-white bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Заполнить форму
              </Link>
            </div>
          </div>

          <div className="text-center">
            <p className="text-primary-200 text-sm">
              Среднее время ответа: <strong>2-3 часа</strong> | 
              Поддержка доступна: <strong>24/7</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpPage;
