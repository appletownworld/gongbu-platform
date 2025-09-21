import { Users, BookOpen, Target, Heart, Award, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-6">
            О платформе <span className="text-primary-600">Gongbu</span>
          </h1>
          <p className="text-xl text-secondary-600 mb-8 leading-relaxed">
            Современная многоязычная образовательная платформа 
            с интеграцией Telegram и интерактивными инструментами обучения
          </p>
          
          <div className="flex justify-center space-x-6 mb-8">
            <div className="bg-white rounded-lg px-4 py-2 shadow-md border border-secondary-100">
              <span className="text-lg font-semibold text-primary-900">🇺🇸 English</span>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-md border border-secondary-100">
              <span className="text-lg font-semibold text-primary-900">🇰🇷 한국어</span>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-md border border-secondary-100">
              <span className="text-lg font-semibold text-primary-900">🇷🇺 Русский</span>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-secondary-100">
              <div className="flex items-center justify-center space-x-4">
                <BookOpen className="w-12 h-12 text-primary-600" />
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-primary-900">공부 (Gongbu)</h3>
                  <p className="text-secondary-600">Изучение • Обучение • Развитие</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary-900 mb-6">
                Наша миссия
              </h2>
              <p className="text-lg text-secondary-600 mb-6 leading-relaxed">
                <strong>"Empowering Creative Minds Through Accessible Education"</strong>
              </p>
              <p className="text-lg text-secondary-600 mb-6 leading-relaxed">
                Мы стремимся сделать качественное образование доступным для всех, 
                предоставляя творческим людям простой и недорогой способ делиться своими знаниями, 
                позволяя им сосредоточиться на том, что они делают лучше всего - создании увлекательного образовательного контента.
              </p>
              <p className="text-lg text-secondary-600 mb-8 leading-relaxed">
                Наша цель — убрать все барьеры между экспертом и учеником, 
                демократизировать обмен знаниями и сделать премиальное образование доступным каждому.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Target className="w-8 h-8 text-primary-600 flex-shrink-0" />
                  <span className="text-secondary-700 font-medium">Доступное образование</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Heart className="w-8 h-8 text-primary-600 flex-shrink-0" />
                  <span className="text-secondary-700 font-medium">Фокус на творчестве</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-8 h-8 text-primary-600 flex-shrink-0" />
                  <span className="text-secondary-700 font-medium">Качество без компромиссов</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="w-8 h-8 text-primary-600 flex-shrink-0" />
                  <span className="text-secondary-700 font-medium">Простота и скорость</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-600 text-white rounded-full p-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900">Сообщество</h3>
                    <p className="text-secondary-600">Активное учебное сообщество</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-600 text-white rounded-full p-3">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900">Технологии</h3>
                    <p className="text-secondary-600">Современные образовательные инструменты</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-600 text-white rounded-full p-3">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900">Качество</h3>
                    <p className="text-secondary-600">Высокие стандарты образования</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-900 mb-12">
            Особенности платформы
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100 hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 rounded-full p-3 w-fit mb-4">
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Интерактивные курсы
              </h3>
              <p className="text-secondary-600">
                Структурированные курсы с интерактивными заданиями, 
                видео-уроками и практическими упражнениями
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100 hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 rounded-full p-3 w-fit mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Telegram интеграция
              </h3>
              <p className="text-secondary-600">
                Обучение через Telegram Web App с уведомлениями, 
                заданиями и поддержкой сообщества
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100 hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 rounded-full p-3 w-fit mb-4">
                <Target className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Персонализация
              </h3>
              <p className="text-secondary-600">
                Адаптивные учебные планы, отслеживание прогресса 
                и рекомендации на основе ваших результатов
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100 hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 rounded-full p-3 w-fit mb-4">
                <Award className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Сертификация
              </h3>
              <p className="text-secondary-600">
                Получайте сертификаты за прохождение курсов 
                и подтверждайте свой уровень знаний
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100 hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 rounded-full p-3 w-fit mb-4">
                <Zap className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Современные технологии
              </h3>
              <p className="text-secondary-600">
                Использование AI, микросервисной архитектуры 
                и современного веб-стека для лучшего опыта
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-secondary-100 hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 rounded-full p-3 w-fit mb-4">
                <Heart className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Поддержка 24/7
              </h3>
              <p className="text-secondary-600">
                Круглосуточная техническая поддержка и помощь 
                от преподавателей и сообщества
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">
            Платформа в цифрах
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">1000+</div>
              <div className="text-primary-100">Активных студентов</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-primary-100">Курсов</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Доступность</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">95%</div>
              <div className="text-primary-100">Удовлетворенность</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-900 mb-6">
            Готовы начать изучение корейского языка?
          </h2>
          <p className="text-lg text-secondary-600 mb-8">
            Присоединяйтесь к тысячам студентов, которые уже изучают корейский язык с Gongbu
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Начать обучение
            </button>
            <button className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
              Посмотреть курсы
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
