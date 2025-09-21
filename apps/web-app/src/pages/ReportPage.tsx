import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ExclamationTriangleIcon,
  BugAntIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  CameraIcon,
  PaperAirplaneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ReportPage: React.FC = () => {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'medium',
    email: '',
    attachments: [] as File[],
    reproductionSteps: '',
    expectedBehavior: '',
    actualBehavior: '',
    browserInfo: '',
    anonymous: false
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    {
      id: 'bug',
      name: 'Техническая ошибка',
      icon: BugAntIcon,
      color: 'text-red-600',
      description: 'Что-то работает не так, как ожидается'
    },
    {
      id: 'security',
      name: 'Проблема безопасности',
      icon: ShieldExclamationIcon,
      color: 'text-orange-600',
      description: 'Уязвимость или подозрительная активность'
    },
    {
      id: 'content',
      name: 'Проблема с контентом',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      description: 'Неточности в материалах или курсах'
    },
    {
      id: 'user',
      name: 'Проблема с пользователем',
      icon: UserCircleIcon,
      color: 'text-purple-600',
      description: 'Нарушения правил или спам'
    },
    {
      id: 'performance',
      name: 'Проблема производительности',
      icon: ComputerDesktopIcon,
      color: 'text-green-600',
      description: 'Медленная загрузка или зависания'
    },
    {
      id: 'other',
      name: 'Другое',
      icon: ExclamationTriangleIcon,
      color: 'text-gray-600',
      description: 'Не подходит к другим категориям'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        attachments: Array.from(e.target.files!)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.title || !formData.description) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitted(true);
      toast.success('Отчет отправлен успешно!');
    } catch (error) {
      toast.error('Ошибка при отправке отчета');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900 flex items-center justify-center">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <div className="bg-white p-12 rounded-xl shadow-lg border border-secondary-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-secondary-800 mb-4">Отчет отправлен!</h1>
            <p className="text-lg text-secondary-600 mb-6">
              Спасибо за ваш отчет. Мы рассмотрим его в ближайшее время и свяжемся с вами при необходимости.
            </p>
            <div className="bg-secondary-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-secondary-600">
                <strong>Номер отчета:</strong> #{Date.now().toString().slice(-8)}
              </p>
              <p className="text-sm text-secondary-600">
                <strong>Ожидаемое время ответа:</strong> 24-48 часов
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="btn-primary"
              >
                На главную
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    category: '',
                    title: '',
                    description: '',
                    priority: 'medium',
                    email: '',
                    attachments: [],
                    reproductionSteps: '',
                    expectedBehavior: '',
                    actualBehavior: '',
                    browserInfo: '',
                    anonymous: false
                  });
                }}
                className="btn-secondary"
              >
                Отправить еще один отчет
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-primary-600 mr-4" />
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700">
              Сообщить о <span className="text-accent-500">проблеме</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto">
            Помогите нам улучшить платформу, сообщив о найденных проблемах или ошибках. Мы ценим ваш вклад!
          </p>
        </div>
      </section>

      {/* Report Form */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Category Selection */}
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Выберите тип проблемы</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                      formData.category === category.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200 hover:border-primary-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={formData.category === category.id}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-center mb-2">
                      <category.icon className={`h-6 w-6 ${category.color} mr-3`} />
                      <span className="font-semibold text-secondary-800">{category.name}</span>
                    </div>
                    <p className="text-sm text-secondary-600">{category.description}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-secondary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-secondary-800 mb-4">Основная информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Заголовок проблемы *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Кратко опишите проблему"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Приоритет
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="critical">Критический</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <h3 className="text-xl font-semibold text-secondary-800 mb-4">Подробное описание</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Описание проблемы *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Подробно опишите что произошло..."
                    required
                  />
                </div>

                {formData.category === 'bug' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Шаги для воспроизведения
                      </label>
                      <textarea
                        name="reproductionSteps"
                        value={formData.reproductionSteps}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="1. Перейти на страницу...&#10;2. Нажать на кнопку...&#10;3. ..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Ожидаемое поведение
                        </label>
                        <textarea
                          name="expectedBehavior"
                          value={formData.expectedBehavior}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Что должно было произойти?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Фактическое поведение
                        </label>
                        <textarea
                          name="actualBehavior"
                          value={formData.actualBehavior}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Что произошло на самом деле?"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Attachments and Technical Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <CameraIcon className="h-4 w-4 inline mr-2" />
                  Скриншоты или файлы
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Максимум 5 файлов, до 10MB каждый
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Информация о браузере
                </label>
                <input
                  type="text"
                  name="browserInfo"
                  value={formData.browserInfo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Chrome 91, Safari 14, и т.д."
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-secondary-800 mb-4">Контактная информация</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email для обратной связи
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Оставьте пустым для анонимного отчета
                  </p>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="anonymous"
                      checked={formData.anonymous}
                      onChange={handleInputChange}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-secondary-700">
                      Отправить анонимно (мы не сможем связаться с вами)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Отправляем...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-3" />
                    Отправить отчет
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-secondary-800 mb-6">
            Нужна быстрая помощь?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/faq"
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-secondary-200"
            >
              <ExclamationTriangleIcon className="h-8 w-8 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-secondary-800 mb-2">FAQ</h3>
              <p className="text-sm text-secondary-600">Ответы на частые вопросы</p>
            </Link>
            <Link
              to="/contact"
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-secondary-200"
            >
              <UserCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-secondary-800 mb-2">Контакты</h3>
              <p className="text-sm text-secondary-600">Свяжитесь с поддержкой</p>
            </Link>
            <Link
              to="/status"
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-secondary-200"
            >
              <ComputerDesktopIcon className="h-8 w-8 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold text-secondary-800 mb-2">Статус системы</h3>
              <p className="text-sm text-secondary-600">Проверить работу сервисов</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReportPage;
