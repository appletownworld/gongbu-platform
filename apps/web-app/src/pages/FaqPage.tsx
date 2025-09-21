import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  AcademicCapIcon,
  CreditCardIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const FaqPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: "Общие вопросы",
      icon: QuestionMarkCircleIcon,
      color: "text-blue-500",
      items: [
        {
          question: "Что такое Gongbu?",
          answer: "Gongbu (공부 - 'изучение' на корейском) — это современная образовательная платформа для изучения корейского языка, интегрированная с Telegram. Мы предлагаем курсы от базового уровня до продвинутого, включая специализированные программы как K-Pop корейский и подготовка к TOPIK."
        },
        {
          question: "Кто может использовать платформу?",
          answer: "Наша платформа подходит для всех, кто хочет изучать корейский язык — от новичков до продвинутых учеников. Единственное требование — наличие аккаунта Telegram для регистрации и получения материалов."
        },
        {
          question: "На каких языках доступна платформа?",
          answer: "В настоящее время платформа доступна на русском языке. Мы планируем добавить поддержку английского и корейского языков в ближайшем будущем."
        },
        {
          question: "Можно ли учиться с мобильного устройства?",
          answer: "Да! Наша платформа полностью адаптирована для мобильных устройств. Более того, благодаря интеграции с Telegram, вы можете получать уведомления и изучать материалы прямо в мессенджере."
        }
      ]
    },
    {
      title: "Регистрация и аккаунт",
      icon: ChatBubbleLeftEllipsisIcon,
      color: "text-green-500",
      items: [
        {
          question: "Как зарегистрироваться на платформе?",
          answer: "Регистрация происходит через Telegram WebApp. Найдите бота @at_gongbubot в Telegram, нажмите /start или /courses, затем кнопку 'Начать изучение'. Ваш аккаунт будет создан автоматически за несколько секунд."
        },
        {
          question: "Почему нет обычной регистрации по email?",
          answer: "Мы используем Telegram для максимальной безопасности и удобства. Это избавляет от необходимости запоминать пароли, обеспечивает мгновенную авторизацию и позволяет получать все материалы прямо в Telegram."
        },
        {
          question: "Что делать, если у меня нет Telegram?",
          answer: "Telegram — бесплатный мессенджер, доступный на всех платформах. Скачайте его на telegram.org и зарегистрируйтесь за 1-2 минуты. После этого вы сможете присоединиться к Gongbu."
        },
        {
          question: "Как удалить аккаунт?",
          answer: "Для удаления аккаунта напишите нашему боту @at_gongbubot команду /delete_account или свяжитесь с поддержкой. Мы удалим все ваши данные в течение 24 часов."
        }
      ]
    },
    {
      title: "Обучение и курсы",
      icon: AcademicCapIcon,
      color: "text-purple-500",
      items: [
        {
          question: "Какие курсы доступны на платформе?",
          answer: "Мы предлагаем 8+ курсов корейского языка: от базового уровня ('Корейский для начинающих') до специализированных ('K-Pop Korean', 'Подготовка к TOPIK', 'Корейский для бизнеса', 'Понимание дорам'). Каталог постоянно расширяется."
        },
        {
          question: "Сколько времени нужно для завершения курса?",
          answer: "Время зависит от курса и вашего темпа. Базовый курс рассчитан на 2-3 месяца при занятиях 3-4 раза в неделю. Специализированные курсы — от 1 до 6 месяцев. Вы можете учиться в своем темпе."
        },
        {
          question: "Выдаются ли сертификаты?",
          answer: "Да! После успешного завершения курса вы получаете официальный сертификат Gongbu, подтверждающий ваши знания. Сертификат можно скачать в PDF формате или поделиться в социальных сетях."
        },
        {
          question: "Есть ли домашние задания?",
          answer: "В платных курсах есть практические задания, которые проверяются преподавателями (план Профессиональный и выше). В бесплатных курсах доступны интерактивные упражнения для самопроверки."
        }
      ]
    },
    {
      title: "Оплата и подписки",
      icon: CreditCardIcon,
      color: "text-orange-500",
      items: [
        {
          question: "Есть ли бесплатные курсы?",
          answer: "Да! Мы предлагаем 2 полностью бесплатных курса: 'Корейский для начинающих' (основы хангыль) и 'Корейский для путешествий'. Этого достаточно для знакомства с языком и платформой."
        },
        {
          question: "Сколько стоят платные планы?",
          answer: "План 'Профессиональный' стоит 1990₽ в месяц и дает доступ ко всем курсам. План 'Премиум' за 3990₽ включает персональные занятия с преподавателем. Есть скидки для студентов (30%) и при годовой оплате (20%)."
        },
        {
          question: "Какие способы оплаты принимаются?",
          answer: "Мы принимаем банковские карты (Visa, MasterCard, Мир), СБП, Яндекс.Деньги, Qiwi. Для корпоративных клиентов доступна оплата по счету. Все платежи обрабатываются безопасно."
        },
        {
          question: "Можно ли вернуть деньги?",
          answer: "Да, мы предлагаем 14-дневную гарантию возврата средств. Если курс вам не подошел, мы вернем полную стоимость без вопросов. Для этого напишите в поддержку."
        }
      ]
    },
    {
      title: "Техническая поддержка",
      icon: ShieldCheckIcon,
      color: "text-red-500",
      items: [
        {
          question: "Что делать, если возникли проблемы с доступом?",
          answer: "Сначала попробуйте перезапустить Telegram и зайти в бота @at_gongbubot заново. Если проблема остается, напишите нашей поддержке в разделе 'Контакты' или прямо боту — мы ответим в течение 2-3 часов."
        },
        {
          question: "Работает ли платформа на всех устройствах?",
          answer: "Да, наша платформа работает на всех устройствах с Telegram: iOS, Android, Windows, macOS, Linux. Веб-версия оптимизирована для всех современных браузеров."
        },
        {
          question: "Что делать, если видео не загружаются?",
          answer: "Проверьте подключение к интернету и убедитесь, что у вас достаточно места на устройстве. Если проблема остается, попробуйте очистить кеш Telegram или свяжитесь с поддержкой."
        },
        {
          question: "Как обновить профиль или изменить настройки?",
          answer: "Все настройки профиля можно изменить через команду /profile в нашем Telegram боте @at_gongbubot. Там же можно изменить уведомления, язык интерфейса и другие параметры."
        }
      ]
    }
  ];

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700 mb-6 leading-tight animate-fade-in-down">
            Часто задаваемые <span className="text-accent-500">вопросы</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto animate-fade-in-up">
            Найдите ответы на самые популярные вопросы о платформе Gongbu, курсах и обучении корейскому языку.
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Поиск по вопросам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16">
              <QuestionMarkCircleIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                Вопросы не найдены
              </h3>
              <p className="text-secondary-500 mb-6">
                Попробуйте изменить поисковый запрос или посмотрите все категории
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="btn-primary"
              >
                Показать все вопросы
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredFaqs.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white">
                  <div className="flex items-center mb-6">
                    <category.icon className={`h-8 w-8 ${category.color} mr-3`} />
                    <h2 className="text-2xl font-bold text-secondary-800">
                      {category.title}
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => {
                      const globalIndex = categoryIndex * 1000 + itemIndex;
                      const isExpanded = expandedItems.includes(globalIndex);
                      
                      return (
                        <div key={itemIndex} className="bg-secondary-50 rounded-lg border border-secondary-200">
                          <button
                            onClick={() => toggleExpanded(globalIndex)}
                            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-secondary-100 transition-colors duration-200 rounded-lg"
                          >
                            <h3 className="text-lg font-semibold text-secondary-800 pr-4">
                              {item.question}
                            </h3>
                            {isExpanded ? (
                              <ChevronUpIcon className="h-5 w-5 text-secondary-500 flex-shrink-0" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-secondary-500 flex-shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-6 pb-4">
                              <p className="text-secondary-600 leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-6">
            Не нашли ответ на свой вопрос?
          </h2>
          <p className="text-lg text-secondary-600 mb-8">
            Наша служба поддержки готова помочь вам 24/7. Свяжитесь с нами любым удобным способом.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
            >
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2" />
              Связаться с поддержкой
            </Link>
            <a
              href="https://t.me/at_gongbubot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-secondary-300 text-base font-medium rounded-lg text-secondary-700 bg-white hover:bg-secondary-50 transition-colors duration-200"
            >
              Написать в Telegram боте
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
