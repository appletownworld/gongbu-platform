import React, { useState } from 'react';
import { Mail, Clock, Send, MessageCircle, Users, Globe } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Симуляция отправки формы
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    
    // Скрыть сообщение об успехе через 5 секунд
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-6">
            Свяжитесь с нами
          </h1>
          <p className="text-xl text-secondary-600 mb-8 leading-relaxed">
            У вас есть вопросы о платформе Gongbu? Мы всегда готовы помочь!
            Свяжитесь с нами любым удобным способом.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-secondary-100">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">
              Отправить сообщение
            </h2>
            
            {submitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700">
                  <Send className="w-5 h-5" />
                  <span className="font-medium">Сообщение отправлено!</span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  Спасибо за ваше сообщение. Мы свяжемся с вами в ближайшее время.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                    Имя *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Ваше имя"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-secondary-700 mb-2">
                  Тема *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="">Выберите тему</option>
                  <option value="general">Общие вопросы</option>
                  <option value="support">Техническая поддержка</option>
                  <option value="courses">Вопросы о курсах</option>
                  <option value="partnership">Партнерство</option>
                  <option value="billing">Оплата и тарифы</option>
                  <option value="feedback">Отзывы и предложения</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-2">
                  Сообщение *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                  placeholder="Опишите ваш вопрос или предложение..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Отправка...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Отправить сообщение</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-secondary-100">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">
                Контактная информация
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 rounded-full p-3 flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900 mb-1">Email</h3>
                    <p className="text-secondary-600">support@gongbu.study</p>
                    <p className="text-secondary-600">info@gongbu.study</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 rounded-full p-3 flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900 mb-1">Telegram</h3>
                    <p className="text-secondary-600">@GongbuSupport</p>
                    <p className="text-secondary-600 text-sm">Быстрая поддержка через Telegram</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 rounded-full p-3 flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900 mb-1">Часы работы поддержки</h3>
                    <p className="text-secondary-600">Пн-Пт: 9:00 - 21:00 (МСК)</p>
                    <p className="text-secondary-600">Сб-Вс: 10:00 - 18:00 (МСК)</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 rounded-full p-3 flex-shrink-0">
                    <Globe className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900 mb-1">Языки поддержки</h3>
                    <p className="text-secondary-600">Русский, Английский, 한국어</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-secondary-100">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">
                Быстрые ссылки
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="/faq"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-secondary-700">FAQ</span>
                </a>
                
                <a
                  href="/help"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-secondary-700">Справка</span>
                </a>
                
                <a
                  href="/courses"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Globe className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-secondary-700">Курсы</span>
                </a>
                
                <a
                  href="/about"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Mail className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-secondary-700">О нас</span>
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">
                Следите за нами
              </h2>
              
              <p className="text-primary-100 mb-6">
                Присоединяйтесь к нашему сообществу в социальных сетях 
                для получения последних новостей и советов по изучению корейского языка.
              </p>
              
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="bg-white/10 backdrop-blur rounded-lg p-3 hover:bg-white/20 transition-colors"
                  aria-label="Telegram"
                >
                  <MessageCircle className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="bg-white/10 backdrop-blur rounded-lg p-3 hover:bg-white/20 transition-colors"
                  aria-label="VKontakte"
                >
                  <Users className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="bg-white/10 backdrop-blur rounded-lg p-3 hover:bg-white/20 transition-colors"
                  aria-label="YouTube"
                >
                  <Globe className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-900 mb-12">
            Часто задаваемые вопросы
          </h2>
          
          <div className="space-y-6">
            <div className="border border-secondary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Как начать изучение корейского языка на платформе?
              </h3>
              <p className="text-secondary-600">
                Зарегистрируйтесь на платформе, выберите подходящий курс для вашего уровня 
                и начинайте обучение. Первые уроки доступны бесплатно.
              </p>
            </div>
            
            <div className="border border-secondary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Можно ли изучать через Telegram?
              </h3>
              <p className="text-secondary-600">
                Да! У нас есть Telegram WebApp, который позволяет изучать курсы прямо в мессенджере 
                с уведомлениями о новых уроках и заданиях.
              </p>
            </div>
            
            <div className="border border-secondary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Сколько времени займет обучение?
              </h3>
              <p className="text-secondary-600">
                Это зависит от вашего уровня и интенсивности занятий. В среднем базовый курс 
                занимает 3-6 месяцев при занятиях 3-4 раза в неделю.
              </p>
            </div>
            
            <div className="border border-secondary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Есть ли сертификация после прохождения курсов?
              </h3>
              <p className="text-secondary-600">
                Да, после успешного завершения курса вы получите сертификат, 
                подтверждающий ваш уровень владения корейским языком.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
