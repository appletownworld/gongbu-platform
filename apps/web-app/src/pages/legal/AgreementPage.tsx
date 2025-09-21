import React from 'react';

/**
 * 📋 Страница пользовательского соглашения
 * 
 * Содержит полные условия использования платформы Gongbu,
 * права и обязанности пользователей, а также правила
 * взаимодействия с сервисом.
 */
const AgreementPage: React.FC = () => {
  return (
    <>
      <div className="min-h-screen bg-secondary-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary-900 mb-4">
              📋 Пользовательское соглашение
            </h1>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Условия использования образовательной платформы Gongbu
            </p>
            <p className="text-sm text-secondary-500 mt-4">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
            </p>
          </div>

          {/* Основной контент */}
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            
            {/* Введение */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                📖 Введение
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Добро пожаловать на образовательную платформу Gongbu! 
                  Настоящее Пользовательское соглашение (далее — «Соглашение») 
                  регулирует отношения между вами (пользователем) и платформой Gongbu 
                  при использовании наших образовательных услуг.
                </p>
                <p>
                  Используя платформу Gongbu, вы соглашаетесь с условиями данного 
                  Соглашения. Если вы не согласны с какими-либо условиями, 
                  пожалуйста, не используйте наши услуги.
                </p>
              </div>
            </section>

            {/* Определения */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                📚 Определения
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Платформа Gongbu</strong> — образовательная онлайн-платформа для изучения корейского языка</li>
                  <li><strong>Пользователь</strong> — физическое лицо, использующее услуги платформы</li>
                  <li><strong>Контент</strong> — учебные материалы, курсы, видео, тексты и другие образовательные ресурсы</li>
                  <li><strong>Аккаунт</strong> — персональная учетная запись пользователя на платформе</li>
                  <li><strong>Услуги</strong> — все образовательные и сопутствующие сервисы платформы</li>
                </ul>
              </div>
            </section>

            {/* Регистрация и аккаунт */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                👤 Регистрация и управление аккаунтом
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  Требования к регистрации
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Для использования платформы необходимо создать аккаунт</li>
                  <li>Вы должны быть не младше 13 лет</li>
                  <li>Предоставляемая информация должна быть точной и актуальной</li>
                  <li>Один пользователь может иметь только один аккаунт</li>
                </ul>

                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  Безопасность аккаунта
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Вы несете ответственность за безопасность своего аккаунта</li>
                  <li>Не передавайте данные для входа третьим лицам</li>
                  <li>Немедленно сообщайте о любых подозрительных действиях</li>
                  <li>Используйте надежные пароли</li>
                </ul>
              </div>
            </section>

            {/* Использование услуг */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                🎓 Использование образовательных услуг
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  Разрешенное использование
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Изучение корейского языка через наши курсы</li>
                  <li>Участие в интерактивных упражнениях</li>
                  <li>Получение сертификатов об обучении</li>
                  <li>Взаимодействие с преподавателями и другими студентами</li>
                </ul>

                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  Запрещенные действия
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Копирование и распространение учебных материалов</li>
                  <li>Попытки взлома или нарушения работы платформы</li>
                  <li>Создание фальшивых аккаунтов</li>
                  <li>Нарушение авторских прав</li>
                  <li>Публикация неподходящего контента</li>
                </ul>
              </div>
            </section>

            {/* Интеллектуальная собственность */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                🧠 Интеллектуальная собственность
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Все материалы на платформе Gongbu, включая тексты, изображения, 
                  видео, аудио, программное обеспечение и дизайн, защищены 
                  авторским правом и другими правами интеллектуальной собственности.
                </p>
                <p>
                  Пользователи получают ограниченную лицензию на использование 
                  контента исключительно в образовательных целях в рамках 
                  предоставляемых услуг.
                </p>
              </div>
            </section>

            {/* Платежи и возвраты */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                💳 Платежи и возвраты
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  Оплата услуг
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Некоторые курсы могут быть платными</li>
                  <li>Цены указаны на странице курса</li>
                  <li>Оплата производится через безопасные платежные системы</li>
                  <li>Доступ к курсу предоставляется после подтверждения оплаты</li>
                </ul>

                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  Политика возвратов
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Возврат возможен в течение 14 дней с момента покупки</li>
                  <li>Возврат не предоставляется, если курс пройден более чем на 20%</li>
                  <li>Для возврата обратитесь в службу поддержки</li>
                  <li>Возврат производится на тот же способ оплаты</li>
                </ul>
              </div>
            </section>

            {/* Конфиденциальность */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                🔒 Конфиденциальность и защита данных
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Мы серьезно относимся к защите ваших персональных данных. 
                  Подробная информация о том, как мы собираем, используем и 
                  защищаем ваши данные, содержится в нашей 
                  <a href="/privacy" className="text-primary-600 hover:underline"> Политике конфиденциальности</a>.
                </p>
                <p>
                  Используя наши услуги, вы соглашаетесь с обработкой ваших 
                  персональных данных в соответствии с указанной политикой.
                </p>
              </div>
            </section>

            {/* Ответственность */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                ⚖️ Ограничение ответственности
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Платформа Gongbu предоставляется «как есть». Мы не гарантируем, 
                  что услуги будут работать без перерывов или ошибок.
                </p>
                <p>
                  Мы не несем ответственности за:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-4">
                  <li>Временные технические сбои</li>
                  <li>Потерю данных из-за действий пользователя</li>
                  <li>Результаты обучения (зависят от усилий студента)</li>
                  <li>Действия третьих лиц</li>
                </ul>
              </div>
            </section>

            {/* Изменения соглашения */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                📝 Изменения соглашения
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Мы можем изменять данное Соглашение. О существенных изменениях 
                  мы уведомим пользователей через уведомления на платформе или 
                  по электронной почте.
                </p>
                <p>
                  Продолжение использования услуг после внесения изменений 
                  означает ваше согласие с новыми условиями.
                </p>
              </div>
            </section>

            {/* Прекращение услуг */}
            <section>
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                🚪 Прекращение услуг
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  Прекращение пользователем
                </h3>
                <p>
                  Вы можете прекратить использование услуг в любое время, 
                  удалив свой аккаунт через настройки профиля.
                </p>

                <h3 className="text-xl font-semibold text-primary-800 mt-6 mb-3">
                  Прекращение платформой
                </h3>
                <p>
                  Мы можем приостановить или прекратить ваш доступ к услугам 
                  в случае нарушения условий данного Соглашения.
                </p>
              </div>
            </section>

            {/* Контакты */}
            <section className="bg-secondary-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-primary-900 mb-4">
                📞 Контактная информация
              </h2>
              <div className="prose prose-lg text-secondary-700">
                <p>
                  Если у вас есть вопросы по данному Соглашению, 
                  свяжитесь с нами:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>📧 Email: legal@gongbu.ru</li>
                  <li>📱 Telegram: @gongbu_support</li>
                  <li>🌐 <a href="/contact" className="text-primary-600 hover:underline">Форма обратной связи</a></li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgreementPage;
