import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Zap, Shield, Users, BookOpen, CheckCircle, ArrowRight, Smartphone, Clock, Star } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-primary-100 rounded-full p-4 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <MessageCircle className="w-12 h-12 text-primary-600" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-6">
            Регистрация через <span className="text-primary-600">Telegram</span>
          </h1>
          
          <p className="text-xl text-secondary-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            В Gongbu регистрация происходит <strong>автоматически</strong> через Telegram. 
            Никаких форм заполнять не нужно — всё работает мгновенно и безопасно!
          </p>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 inline-block border border-green-200">
            <div className="flex items-center justify-center space-x-2 text-green-700">
              <Zap className="w-6 h-6" />
              <span className="text-lg font-semibold">Регистрация за &lt; 1 секунды!</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-900 mb-12">
            Как это работает?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-primary-600" />
              </div>
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                Найдите бота
              </h3>
              <p className="text-secondary-600 text-sm">
                Откройте Telegram и найдите бота <strong>@at_gongbubot</strong>
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                Выберите курс
              </h3>
              <p className="text-secondary-600 text-sm">
                Напишите <strong>/courses</strong> или нажмите <strong>/start</strong>
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-primary-600" />
              </div>
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                Нажмите "Начать"
              </h3>
              <p className="text-secondary-600 text-sm">
                Telegram WebApp откроется автоматически
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                ✓
              </div>
              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                Готово!
              </h3>
              <p className="text-secondary-600 text-sm">
                Вы автоматически зарегистрированы и можете учиться
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-900 mb-12">
            Преимущества Telegram-регистрации
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-900 mb-2">
                    Мгновенно
                  </h3>
                  <p className="text-secondary-600">
                    Регистрация занимает менее 1 секунды. Никаких форм для заполнения, 
                    подтверждения email или ожидания активации.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 rounded-full p-3 flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-900 mb-2">
                    Безопасно
                  </h3>
                  <p className="text-secondary-600">
                    Все данные проверяются через официальный Telegram API. 
                    Мы не храним пароли и не имеем доступа к вашему аккаунту Telegram.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 rounded-full p-3 flex-shrink-0">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-900 mb-2">
                    Удобно
                  </h3>
                  <p className="text-secondary-600">
                    Обучение происходит прямо в Telegram. Получайте уведомления о новых уроках, 
                    общайтесь с преподавателями и студентами.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 rounded-full p-3 flex-shrink-0">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-900 mb-2">
                    Персонализировано
                  </h3>
                  <p className="text-secondary-600">
                    Ваше имя, фото профиля и языковые предпочтения подтягиваются 
                    автоматически из вашего Telegram аккаунта.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Готовы начать изучение корейского языка?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Присоединяйтесь к тысячам студентов уже сегодня!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://t.me/at_gongbubot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center space-x-2 shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Открыть Telegram бота</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            
            <Link
              to="/courses"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Посмотреть курсы
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-900 mb-12">
            Часто задаваемые вопросы
          </h2>
          
          <div className="space-y-6">
            <div className="border border-secondary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Можно ли зарегистрироваться без Telegram?
              </h3>
              <p className="text-secondary-600">
                Нет, регистрация в Gongbu возможна только через Telegram. Это обеспечивает 
                максимальную безопасность и удобство использования платформы.
              </p>
            </div>
            
            <div className="border border-secondary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Безопасно ли использовать Telegram для регистрации?
              </h3>
              <p className="text-secondary-600">
                Да, абсолютно безопасно. Мы используем официальный Telegram WebApp API, 
                который гарантирует подлинность данных. Мы не получаем доступ к вашим личным сообщениям.
              </p>
            </div>
            
            <div className="border border-secondary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Что если у меня нет красивого имени в Telegram?
              </h3>
              <p className="text-secondary-600">
                Не волнуйтесь! Вы всегда можете изменить отображаемое имя в настройках 
                своего профиля после регистрации в платформе.
              </p>
            </div>
            
            <div className="border border-secondary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Сколько это стоит?
              </h3>
              <p className="text-secondary-600">
                Регистрация и базовые курсы абсолютно бесплатны. Вы можете начать изучение 
                корейского языка прямо сейчас без каких-либо затрат.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Login */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-secondary-50">
        <div className="max-w-md mx-auto text-center">
          <p className="text-secondary-600 mb-4">
            Уже зарегистрированы и хотите войти через веб?
          </p>
          <Link 
            to="/login" 
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Войти в аккаунт
          </Link>
        </div>
      </section>
    </div>
  );
}