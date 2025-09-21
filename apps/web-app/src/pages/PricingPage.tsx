import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckIcon, 
  XMarkIcon, 
  StarIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: "Бесплатный",
      price: "0",
      period: "навсегда",
      description: "Идеально для знакомства с платформой",
      features: [
        "Доступ к 2 бесплатным курсам",
        "Основы корейского алфавита (хангыль)",
        "Базовые фразы для путешествий", 
        "Сообщество в Telegram",
        "Базовая поддержка"
      ],
      limitations: [
        "Ограниченный каталог курсов",
        "Нет персональной обратной связи",
        "Нет сертификатов",
        "Реклама в интерфейсе"
      ],
      popular: false,
      buttonText: "Начать бесплатно",
      buttonLink: "/register"
    },
    {
      name: "Профессиональный",
      price: "1990",
      period: "в месяц",
      description: "Для серьезного изучения корейского языка",
      features: [
        "Доступ ко всем курсам (8+ курсов)",
        "K-Pop корейский и дорамы",
        "Подготовка к экзамену TOPIK",
        "Персональная обратная связь",
        "Сертификаты о завершении",
        "Приоритетная поддержка",
        "Без рекламы",
        "Мобильное приложение",
        "Offline просмотр материалов"
      ],
      limitations: [],
      popular: true,
      buttonText: "Выбрать план",
      buttonLink: "/register"
    },
    {
      name: "Премиум",
      price: "3990", 
      period: "в месяц",
      description: "Максимальный результат с менторской поддержкой",
      features: [
        "Все возможности Профессионального",
        "1-на-1 сессии с преподавателем",
        "Персональный план обучения",
        "Проверка домашних заданий",
        "Разговорная практика по видеосвязи",
        "Доступ к эксклюзивным материалам",
        "Групповые мастер-классы",
        "Приоритетное место в бета-тестировании"
      ],
      limitations: [],
      popular: false,
      buttonText: "Выбрать план",
      buttonLink: "/register"
    }
  ];

  const faqs = [
    {
      question: "Можно ли отменить подписку?",
      answer: "Да, вы можете отменить подписку в любое время. Доступ к премиум-функциям сохранится до конца оплаченного периода."
    },
    {
      question: "Есть ли скидки для студентов?",
      answer: "Да, студенты очных учебных заведений получают скидку 30% на все платные планы при предоставлении справки."
    },
    {
      question: "Что включает персональная обратная связь?",
      answer: "Преподаватель проверяет ваши задания, дает рекомендации по улучшению произношения и грамматики, отвечает на вопросы."
    },
    {
      question: "Можно ли поменять план во время подписки?",
      answer: "Конечно! Вы можете повысить или понизить план в любое время. При повышении доплачиваете разницу, при понижении возвращаем остаток."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700 mb-6 leading-tight animate-fade-in-down">
            Выберите свой <span className="text-accent-500">план</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto animate-fade-in-up">
            Начните изучение корейского языка с планом, который подходит именно вам. Все планы включают доступ через Telegram.
          </p>
          
          {/* Price Toggle */}
          <div className="inline-flex bg-secondary-100 rounded-lg p-1 mb-12">
            <button className="px-6 py-2 rounded-md text-sm font-medium bg-white text-primary-600 shadow-sm">
              Ежемесячно
            </button>
            <button className="px-6 py-2 rounded-md text-sm font-medium text-secondary-600 hover:text-secondary-800">
              Ежегодно <span className="text-green-500 text-xs">-20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  plan.popular 
                    ? 'border-primary-500 ring-4 ring-primary-100 transform scale-105' 
                    : 'border-secondary-200 hover:border-primary-300'
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white text-center py-2 rounded-t-xl">
                    <div className="flex items-center justify-center">
                      <StarIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm font-semibold">Самый популярный</span>
                    </div>
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-secondary-800 mb-2">{plan.name}</h3>
                  <p className="text-secondary-600 mb-6">{plan.description}</p>
                  
                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-extrabold text-primary-700">
                      {plan.price === "0" ? "Бесплатно" : `₽${plan.price}`}
                    </span>
                    {plan.price !== "0" && (
                      <span className="text-secondary-500 ml-2">/{plan.period}</span>
                    )}
                  </div>

                  <Link
                    to={plan.buttonLink}
                    className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg transition-all duration-300 ${
                      plan.popular
                        ? 'text-white bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl'
                        : 'text-primary-600 bg-primary-50 hover:bg-primary-100 border-primary-200'
                    }`}
                  >
                    {plan.buttonText}
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>

                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-secondary-800 mb-4 flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      Что включено:
                    </h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-secondary-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="text-sm font-semibold text-secondary-800 mb-4 mt-6 flex items-center">
                          <XMarkIcon className="h-4 w-4 text-gray-400 mr-2" />
                          Ограничения:
                        </h4>
                        <ul className="space-y-3">
                          {plan.limitations.map((limitation, i) => (
                            <li key={i} className="flex items-start">
                              <XMarkIcon className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-secondary-500">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 mb-12">
            Что получают наши студенты
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <AcademicCapIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-800 mb-4">Качественное образование</h3>
              <p className="text-secondary-600">
                Курсы разработаны экспертами корейского языка с учетом современных методик преподавания.
              </p>
            </div>
            <div className="text-center p-8">
              <ChatBubbleLeftEllipsisIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-800 mb-4">Telegram интеграция</h3>
              <p className="text-secondary-600">
                Все материалы и уведомления приходят прямо в Telegram. Учитесь где угодно и когда угодно.
              </p>
            </div>
            <div className="text-center p-8">
              <TrophyIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-800 mb-4">Сертификация</h3>
              <p className="text-secondary-600">
                Получайте официальные сертификаты Gongbu после успешного завершения курсов.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 mb-12">
            Часто задаваемые вопросы
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
                <h3 className="text-lg font-semibold text-secondary-800 mb-3">{faq.question}</h3>
                <p className="text-secondary-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary-700 text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Начните изучение корейского сегодня
          </h2>
          <p className="text-lg text-primary-200 mb-8">
            Присоединяйтесь к тысячам студентов, которые уже изучают корейский язык с Gongbu
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-base font-medium rounded-full shadow-lg text-primary-700 bg-white hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Попробовать бесплатно <ArrowRightIcon className="ml-3 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
