import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * 🍪 Страница политики использования cookies
 * 
 * Содержит информацию о том, как платформа использует cookies,
 * какие типы cookies применяются, и как пользователи могут
 * управлять своими настройками.
 */
const CookiesPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Политика использования Cookies - Gongbu</title>
        <meta 
          name="description" 
          content="Узнайте, как платформа Gongbu использует cookies для улучшения пользовательского опыта и аналитики" 
        />
      </Helmet>

      <div className="min-h-screen bg-secondary-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary-900 mb-4">
              🍪 Политика использования Cookies
            </h1>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Информация о том, как мы используем cookies для улучшения вашего опыта на платформе Gongbu
            </p>
            <p className="text-sm text-secondary-500 mt-4">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
            </p>
          </div>

          {/* Основной контент */}
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            
            {/* Что такое cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                🍪 Что такое Cookies?
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Cookies — это небольшие текстовые файлы, которые сохраняются на вашем устройстве 
                  при посещении веб-сайтов. Они помогают сайтам запоминать информацию о ваших 
                  предпочтениях и улучшать пользовательский опыт.
                </p>
                <p>
                  На платформе Gongbu мы используем cookies для обеспечения корректной работы 
                  сервиса, аналитики и персонализации контента.
                </p>
              </div>
            </section>

            {/* Типы cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                📋 Типы Cookies, которые мы используем
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                {/* Обязательные cookies */}
                <div className="bg-primary-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-primary-900 mb-3">
                    🔒 Обязательные Cookies
                  </h3>
                  <p className="text-secondary-700 mb-3">
                    Необходимы для базовой функциональности сайта:
                  </p>
                  <ul className="text-sm text-secondary-600 space-y-1">
                    <li>• Аутентификация пользователей</li>
                    <li>• Сохранение настроек сессии</li>
                    <li>• Безопасность и защита от CSRF</li>
                    <li>• Базовая навигация по сайту</li>
                  </ul>
                </div>

                {/* Аналитические cookies */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    📊 Аналитические Cookies
                  </h3>
                  <p className="text-secondary-700 mb-3">
                    Помогают нам понять, как используется платформа:
                  </p>
                  <ul className="text-sm text-secondary-600 space-y-1">
                    <li>• Статистика посещений</li>
                    <li>• Популярные страницы и курсы</li>
                    <li>• Время, проведенное на сайте</li>
                    <li>• Источники трафика</li>
                  </ul>
                </div>

                {/* Функциональные cookies */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">
                    ⚙️ Функциональные Cookies
                  </h3>
                  <p className="text-secondary-700 mb-3">
                    Улучшают ваш пользовательский опыт:
                  </p>
                  <ul className="text-sm text-secondary-600 space-y-1">
                    <li>• Запоминание предпочтений</li>
                    <li>• Персонализация контента</li>
                    <li>• Сохранение прогресса обучения</li>
                    <li>• Настройки интерфейса</li>
                  </ul>
                </div>

                {/* Рекламные cookies */}
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                    📢 Рекламные Cookies
                  </h3>
                  <p className="text-secondary-700 mb-3">
                    Используются для показа релевантной рекламы:
                  </p>
                  <ul className="text-sm text-secondary-600 space-y-1">
                    <li>• Персонализированные предложения</li>
                    <li>• Рекомендации курсов</li>
                    <li>• Отслеживание эффективности</li>
                    <li>• Ограничение повторных показов</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Управление cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                ⚙️ Управление Cookies
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Вы можете управлять настройками cookies несколькими способами:
                </p>
                
                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  🌐 Настройки браузера
                </h3>
                <p>
                  Большинство браузеров позволяют блокировать или удалять cookies. 
                  Обратите внимание, что отключение обязательных cookies может 
                  повлиять на функциональность сайта.
                </p>

                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  🎛️ Панель управления
                </h3>
                <p>
                  В вашем профиле на платформе Gongbu вы можете настроить 
                  предпочтения по использованию аналитических и рекламных cookies.
                </p>

                <div className="bg-primary-50 p-4 rounded-lg mt-4">
                  <p className="text-primary-800 font-medium">
                    💡 Совет: Обязательные cookies необходимы для работы платформы. 
                    Мы рекомендуем оставить их включенными для лучшего опыта.
                  </p>
                </div>
              </div>
            </section>

            {/* Сторонние сервисы */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                🔗 Сторонние сервисы
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Мы можем использовать сторонние сервисы, которые также устанавливают 
                  свои cookies:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Google Analytics</strong> — для аналитики и статистики</li>
                  <li><strong>Telegram WebApp</strong> — для интеграции с Telegram</li>
                  <li><strong>Vite/React</strong> — для разработки и отладки</li>
                  <li><strong>CDN сервисы</strong> — для быстрой загрузки контента</li>
                </ul>
              </div>
            </section>

            {/* Обновления политики */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                📅 Обновления политики
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Мы можем обновлять эту политику cookies. О существенных изменениях 
                  мы уведомим вас через уведомления на платформе или по email.
                </p>
                <p>
                  Рекомендуем периодически проверять эту страницу для получения 
                  актуальной информации.
                </p>
              </div>
            </section>

            {/* Контакты */}
            <section className="bg-secondary-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                📞 Вопросы по Cookies
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Если у вас есть вопросы о нашей политике использования cookies, 
                  свяжитесь с нами:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>📧 Email: privacy@gongbu.ru</li>
                  <li>📱 Telegram: @gongbu_support</li>
                  <li>🌐 Через форму обратной связи на сайте</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookiesPage;
