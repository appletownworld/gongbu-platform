import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCircleIcon, 
  AcademicCapIcon, 
  TrophyIcon, 
  ArrowRightIcon,
  PlayIcon,
  CheckCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Регистрация через Telegram",
      description: "Быстрая авторизация через Telegram WebApp без форм и паролей",
      icon: ChatBubbleLeftEllipsisIcon,
      details: [
        "Найдите @at_gongbubot в Telegram",
        "Нажмите 'Начать изучение'", 
        "Автоматическая регистрация за 1 секунду"
      ]
    },
    {
      number: "02", 
      title: "Выбор курса",
      description: "Изучите каталог курсов корейского языка и выберите подходящий уровень",
      icon: AcademicCapIcon,
      details: [
        "8+ курсов корейского языка",
        "От начинающего до продвинутого",
        "K-Pop корейский, TOPIK подготовка"
      ]
    },
    {
      number: "03",
      title: "Обучение в своем темпе", 
      description: "Проходите уроки, выполняйте задания и отслеживайте прогресс",
      icon: PlayIcon,
      details: [
        "Интерактивные видео-уроки",
        "Практические упражнения",
        "Прогресс в реальном времени"
      ]
    },
    {
      number: "04",
      title: "Получение сертификата",
      description: "После завершения курса получите официальный сертификат знаний",
      icon: TrophyIcon,
      details: [
        "Официальный сертификат Gongbu",
        "Подтверждение знаний",
        "Возможность поделиться достижением"
      ]
    }
  ];

  const features = [
    {
      title: "Telegram Integration",
      description: "Все уведомления и материалы прямо в Telegram",
      icon: ChatBubbleLeftEllipsisIcon
    },
    {
      title: "Адаптивное обучение",
      description: "Система подстраивается под ваш темп и стиль изучения",
      icon: ClockIcon
    },
    {
      title: "Живое общение",
      description: "Общайтесь с преподавателями и другими студентами",
      icon: UserCircleIcon
    },
    {
      title: "Практические навыки", 
      description: "Применяйте знания на реальных проектах и ситуациях",
      icon: CheckCircleIcon
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10"></div>
        <div className="relative container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700 mb-6 leading-tight animate-fade-in-down">
            Как работает <span className="text-accent-500">Gongbu</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto animate-fade-in-up">
            Изучение корейского языка стало простым и увлекательным. Узнайте, как всего за 4 шага начать свое обучение
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300 ease-in-out transform hover:scale-105 animate-bounce-in"
          >
            Начать сейчас <ArrowRightIcon className="ml-3 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 mb-16">
            Как начать обучение
          </h2>
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col lg:flex-row items-center gap-12 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <span className="text-6xl font-bold text-primary-200 mr-4">
                      {step.number}
                    </span>
                    <step.icon className="h-12 w-12 text-primary-600" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-secondary-800 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-lg text-secondary-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-secondary-600">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="w-80 h-80 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center shadow-lg">
                    <step.icon className="h-32 w-32 text-primary-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 mb-12">
            Преимущества платформы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-secondary-200"
              >
                <feature.icon className="h-12 w-12 text-primary-500 mb-4" />
                <h3 className="text-xl font-semibold text-secondary-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary-700 text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Готовы начать изучение корейского языка?
          </h2>
          <p className="text-lg text-primary-200 mb-8">
            Присоединяйтесь к тысячам студентов, которые уже изучают корейский с Gongbu
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-base font-medium rounded-full shadow-lg text-primary-700 bg-white hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Начать обучение бесплатно <ArrowRightIcon className="ml-3 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
