import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheckIcon,
  DocumentTextIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <ShieldCheckIcon className="h-12 w-12 text-primary-600 mr-4" />
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700">
              Политика <span className="text-accent-500">конфиденциальности</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto">
            Мы серьезно относимся к защите ваших персональных данных и соблюдаем все требования законодательства.
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
                <UserIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">1. Общие положения</h2>
              </div>
              <div className="bg-secondary-50 rounded-lg p-6 border border-secondary-200">
                <p className="text-secondary-700 leading-relaxed mb-4">
                  Настоящая Политика конфиденциальности регулирует порядок обработки и использования персональных и иных данных пользователей образовательной платформы Gongbu (далее — «Платформа»).
                </p>
                <p className="text-secondary-700 leading-relaxed mb-4">
                  Используя наши услуги, вы соглашаетесь с условиями данной Политики конфиденциальности. Если вы не согласны с какими-либо условиями, пожалуйста, не используйте наши услуги.
                </p>
                <p className="text-secondary-700 leading-relaxed">
                  Мы обрабатываем данные в соответствии с Федеральным законом «О персональных данных» № 152-ФЗ и международными стандартами защиты информации.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">2. Какие данные мы собираем</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Telegram данные (основной способ регистрации)</h3>
                  <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                    <li>Telegram ID (уникальный идентификатор)</li>
                    <li>Имя и фамилия (если указаны в профиле)</li>
                    <li>Username (если установлен)</li>
                    <li>Фотография профиля (если установлена)</li>
                    <li>Данные авторизации через Telegram WebApp</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Данные об обучении</h3>
                  <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                    <li>Прогресс прохождения курсов</li>
                    <li>Результаты выполнения заданий</li>
                    <li>Время изучения материалов</li>
                    <li>Предпочтения в обучении</li>
                    <li>Оценки и сертификаты</li>
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3">Технические данные</h3>
                  <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                    <li>IP-адрес и данные о местоположении</li>
                    <li>Тип устройства и браузера</li>
                    <li>Данные о взаимодействии с платформой</li>
                    <li>Cookies и localStorage</li>
                    <li>Логи системных событий</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <EyeSlashIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">3. Как мы используем ваши данные</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-secondary-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Основные цели:</h3>
                  <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                    <li>Предоставление образовательных услуг</li>
                    <li>Персонализация обучения</li>
                    <li>Отслеживание прогресса</li>
                    <li>Выдача сертификатов</li>
                    <li>Техническая поддержка</li>
                  </ul>
                </div>
                <div className="bg-white border border-secondary-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Дополнительные цели:</h3>
                  <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                    <li>Улучшение качества сервиса</li>
                    <li>Аналитика и статистика</li>
                    <li>Информирование о новых курсах</li>
                    <li>Обеспечение безопасности</li>
                    <li>Соблюдение законодательства</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <LockClosedIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">4. Защита данных</h2>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 border border-green-200">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LockClosedIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">Шифрование</h3>
                    <p className="text-sm text-secondary-600">Все данные передаются по защищенному HTTPS протоколу</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">Контроль доступа</h3>
                    <p className="text-sm text-secondary-600">Строгое ограничение доступа к персональным данным</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-2">Аудит</h3>
                    <p className="text-sm text-secondary-600">Регулярный мониторинг и аудит безопасности</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <UserIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">5. Ваши права</h2>
              </div>
              <div className="bg-secondary-50 rounded-lg p-6 border border-secondary-200">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-3">Вы имеете право:</h3>
                    <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                      <li>Получать информацию о ваших данных</li>
                      <li>Исправлять неточные данные</li>
                      <li>Удалить ваши персональные данные</li>
                      <li>Ограничить обработку данных</li>
                      <li>Получить копию ваших данных</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-800 mb-3">Как воспользоваться:</h3>
                    <ul className="list-disc pl-6 text-secondary-700 space-y-2">
                      <li>Обратитесь в службу поддержки</li>
                      <li>Используйте настройки профиля</li>
                      <li>Напишите нам на email</li>
                      <li>Обратитесь через Telegram бот</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <EnvelopeIcon className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-secondary-800">6. Контактная информация</h2>
              </div>
              <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
                <p className="text-secondary-700 mb-4">
                  По всем вопросам, связанным с обработкой персональных данных, вы можете обратиться к нам:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-secondary-800 mb-2">Email:</h3>
                    <p className="text-primary-600">privacy@gongbu.appletownworld.com</p>
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
            Вопросы по конфиденциальности?
          </h2>
          <p className="text-lg text-secondary-300 mb-8">
            Свяжитесь с нами, если у вас есть вопросы о том, как мы обрабатываем ваши данные
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-secondary-900 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <EnvelopeIcon className="h-5 w-5 mr-2" />
            Связаться с нами
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
