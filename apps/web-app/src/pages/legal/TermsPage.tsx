import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <ScaleIcon className="h-12 w-12 text-primary-600 mr-4" />
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700">
              Условия <span className="text-accent-500">использования</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto">
            Правила и условия использования образовательной платформы Gongbu. Пожалуйста, внимательно ознакомьтесь с документом.
          </p>
          <p className="text-sm text-secondary-500">
            Последнее обновление: 15 сентября 2025 года
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            
            {/* Section 1 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">1. Принятие условий</h2>
              </div>
              <div className="bg-secondary-50 rounded-lg p-6 border border-secondary-200">
                <p className="text-secondary-700 leading-relaxed mb-4">
                  Добро пожаловать на образовательную платформу Gongbu! Используя наши услуги, вы соглашаетесь соблюдать настоящие Условия использования.
                </p>
                <p className="text-secondary-700 leading-relaxed mb-4">
                  Если вы не согласны с любой частью этих условий, пожалуйста, не используйте нашу платформу. Мы оставляем за собой право изменять эти условия в любое время.
                </p>
                <p className="text-secondary-700 leading-relaxed">
                  Продолжая использовать платформу после внесения изменений, вы автоматически принимаете новые условия.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">2. Права и обязанности пользователя</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Ваши права:</h3>
                  <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                    <li>Доступ к купленным курсам без ограничения времени</li>
                    <li>Получение обновлений курсов</li>
                    <li>Техническая поддержка</li>
                    <li>Защита персональных данных</li>
                    <li>Возврат средств согласно политике</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3">Ваши обязанности:</h3>
                  <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                    <li>Предоставлять достоверную информацию</li>
                    <li>Не нарушать авторские права</li>
                    <li>Соблюдать этику общения</li>
                    <li>Не распространять материалы курсов</li>
                    <li>Информировать о технических проблемах</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <ExclamationTriangleIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">3. Запрещенные действия</h2>
              </div>
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-4">Категорически запрещается:</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-secondary-800 mb-2">Технические нарушения:</h4>
                    <ul className="list-disc pl-6 text-secondary-700 space-y-1 text-sm">
                      <li>Попытки взлома системы</li>
                      <li>DDoS атаки</li>
                      <li>Использование ботов</li>
                      <li>Скрейпинг контента</li>
                      <li>Обход ограничений</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-800 mb-2">Контентные нарушения:</h4>
                    <ul className="list-disc pl-6 text-secondary-700 space-y-1 text-sm">
                      <li>Распространение материалов</li>
                      <li>Продажа доступов</li>
                      <li>Плагиат</li>
                      <li>Спам и реклама</li>
                      <li>Оскорбления</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <ClockIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">4. Оплата и возвраты</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Условия оплаты:</h3>
                  <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                    <li>Оплата производится в рублях</li>
                    <li>Принимаются банковские карты и электронные кошельки</li>
                    <li>Доступ к курсу предоставляется после подтверждения оплаты</li>
                    <li>Подписка продлевается автоматически (можно отменить)</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Политика возвратов:</h3>
                  <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                    <li>14-дневная гарантия возврата для новых пользователей</li>
                    <li>Возврат возможен, если изучено менее 20% курса</li>
                    <li>Возврат обрабатывается в течение 7 рабочих дней</li>
                    <li>При технических проблемах возврат возможен в любое время</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">5. Интеллектуальная собственность</h2>
              </div>
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <p className="text-secondary-700 leading-relaxed mb-4">
                  Все материалы на платформе (видео, тексты, изображения, задания) являются интеллектуальной собственностью Gongbu или наших партнеров.
                </p>
                <p className="text-secondary-700 leading-relaxed mb-4">
                  <strong>Вы получаете право:</strong> изучать материалы для личного образования, делать заметки, выполнять задания.
                </p>
                <p className="text-secondary-700 leading-relaxed">
                  <strong>Вы НЕ имеете права:</strong> копировать, распространять, продавать, модифицировать или публично демонстрировать наши материалы без письменного согласия.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <ExclamationTriangleIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">6. Ограничение ответственности</h2>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <p className="text-secondary-700 leading-relaxed mb-4">
                  Мы прилагаем все усилия для предоставления качественного образования, но не можем гарантировать конкретные результаты обучения.
                </p>
                <p className="text-secondary-700 leading-relaxed mb-4">
                  Наша ответственность ограничена стоимостью приобретенного курса. Мы не несем ответственности за косвенные убытки.
                </p>
                <p className="text-secondary-700 leading-relaxed">
                  В случае технических сбоев мы обязуемся восстановить доступ в кратчайшие сроки и при необходимости продлить подписку.
                </p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <EnvelopeIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">7. Контактная информация</h2>
              </div>
              <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
                <p className="text-secondary-700 mb-4">
                  По всем вопросам, связанным с условиями использования, обращайтесь:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-secondary-800 mb-2">Email:</h3>
                    <p className="text-primary-600">legal@gongbu.appletownworld.com</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-800 mb-2">Telegram бот:</h3>
                    <p className="text-primary-600">@at_gongbubot</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-800 mb-2">Форма обратной связи:</h3>
                    <Link to="/contact" className="text-primary-600 hover:underline">Страница контактов</Link>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-800 mb-2">Время ответа:</h3>
                    <p className="text-secondary-600">В течение 3 рабочих дней</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-secondary-900 text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Остались вопросы по условиям?
          </h2>
          <p className="text-lg text-secondary-300 mb-8">
            Наша команда готова разъяснить любые положения наших условий использования
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-secondary-900 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Связаться с нами
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center justify-center px-8 py-3 border border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-secondary-900 transition-colors duration-200"
            >
              Посмотреть FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
