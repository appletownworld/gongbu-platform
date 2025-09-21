import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrophyIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  ShareIcon,
  DownloadIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const CertificatesPage: React.FC = () => {
  const certificateTypes = [
    {
      id: 1,
      title: "Сертификат завершения курса",
      description: "Выдается после успешного завершения любого курса на платформе",
      icon: AcademicCapIcon,
      color: "bg-blue-500",
      requirements: [
        "Завершение всех уроков курса",
        "Выполнение практических заданий", 
        "Прохождение итогового теста (70% и выше)"
      ],
      features: [
        "Цифровой сертификат в PDF",
        "Уникальный номер для проверки",
        "QR-код для подтверждения подлинности",
        "Возможность поделиться в соцсетях"
      ],
      sample: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&h=300&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    {
      id: 2,
      title: "Сертификат уровня владения",
      description: "Подтверждает достигнутый уровень корейского языка по международной шкале",
      icon: TrophyIcon,
      color: "bg-gold-500",
      requirements: [
        "Завершение курса определенного уровня",
        "Прохождение комплексного тестирования",
        "Устная часть экзамена (для уровней B1 и выше)"
      ],
      features: [
        "Соответствие международным стандартам",
        "Признается работодателями",
        "Детальная разбивка навыков",
        "Срок действия: 2 года"
      ],
      sample: "https://images.unsplash.com/photo-1606390003862-6b5b9bffd2e1?q=80&w=400&h=300&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    {
      id: 3,
      title: "Специализированный сертификат",
      description: "Для специальных программ: деловой корейский, K-Pop корейский, TOPIK подготовка",
      icon: CheckBadgeIcon,
      color: "bg-purple-500",
      requirements: [
        "Завершение специализированной программы",
        "Финальный проект или презентация",
        "Экспертная оценка преподавателя"
      ],
      features: [
        "Указание специализации",
        "Рекомендации для карьеры",
        "Доступ к профессиональной сети",
        "Приоритет при трудоустройстве"
      ],
      sample: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=400&h=300&auto=format&fit=crop&ixlib=rb-4.0.3"
    }
  ];

  const stats = [
    { label: "Сертификатов выдано", value: "2,847", icon: TrophyIcon },
    { label: "Средний балл", value: "87%", icon: StarIcon },
    { label: "Курсов с сертификацией", value: "12", icon: AcademicCapIcon },
    { label: "Работодателей признают", value: "150+", icon: UserGroupIcon }
  ];

  const recentCertificates = [
    {
      studentName: "Анна К.",
      courseName: "K-Pop Korean: Изучаем язык через любимые песни",
      level: "Intermediate",
      date: "15 сентября 2025",
      score: "92%"
    },
    {
      studentName: "Дмитрий М.",
      courseName: "Подготовка к TOPIK I: Уровень 1-2",
      level: "TOPIK I",
      date: "12 сентября 2025",
      score: "88%"
    },
    {
      studentName: "Екатерина Л.",
      courseName: "Корейский для начинающих: Основы и первые фразы",
      level: "Beginner",
      date: "10 сентября 2025",
      score: "95%"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <TrophyIcon className="h-12 w-12 text-primary-600 mr-4" />
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700">
              <span className="text-accent-500">Сертификаты</span> Gongbu
            </h1>
          </div>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto">
            Получите официальное подтверждение своих знаний корейского языка. Наши сертификаты признаются работодателями и учебными заведениями.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                <stat.icon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary-700">{stat.value}</div>
                <div className="text-sm text-primary-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate Types */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 mb-12">
            Типы сертификатов
          </h2>
          <div className="space-y-12">
            {certificateTypes.map((cert, index) => (
              <div
                key={cert.id}
                className={`flex flex-col lg:flex-row items-center gap-12 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${cert.color} bg-opacity-10 mr-4`}>
                      <cert.icon className={`h-8 w-8 ${cert.color.replace('bg-', 'text-')}`} />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-secondary-800">
                      {cert.title}
                    </h3>
                  </div>
                  <p className="text-lg text-secondary-600 mb-6">{cert.description}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-secondary-800 mb-3">Требования:</h4>
                      <ul className="space-y-2">
                        {cert.requirements.map((req, i) => (
                          <li key={i} className="flex items-start text-secondary-600">
                            <CheckBadgeIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-secondary-800 mb-3">Особенности:</h4>
                      <ul className="space-y-2">
                        {cert.features.map((feature, i) => (
                          <li key={i} className="flex items-start text-secondary-600">
                            <StarIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex justify-center">
                  <img
                    src={cert.sample}
                    alt={`Пример ${cert.title}`}
                    className="max-w-full h-auto rounded-lg shadow-lg border-2 border-secondary-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Get Certificate */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 mb-12">
            Как получить сертификат
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Запишитесь на курс",
                description: "Выберите курс и начните обучение",
                icon: AcademicCapIcon
              },
              {
                step: "2", 
                title: "Изучайте материалы",
                description: "Проходите уроки и выполняйте задания",
                icon: ClockIcon
              },
              {
                step: "3",
                title: "Сдайте экзамен",
                description: "Пройдите итоговое тестирование",
                icon: DocumentTextIcon
              },
              {
                step: "4",
                title: "Получите сертификат",
                description: "Скачайте и поделитесь достижением",
                icon: TrophyIcon
              }
            ].map((step, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">{step.step}</span>
                </div>
                <step.icon className="h-8 w-8 text-primary-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-secondary-800 mb-3">{step.title}</h3>
                <p className="text-secondary-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Certificates */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 mb-12">
            Недавно выданные сертификаты
          </h2>
          <div className="space-y-4">
            {recentCertificates.map((cert, index) => (
              <div key={index} className="bg-secondary-50 rounded-lg p-6 border border-secondary-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrophyIcon className="h-6 w-6 text-yellow-500 mr-4" />
                    <div>
                      <div className="font-semibold text-secondary-800">{cert.studentName}</div>
                      <div className="text-sm text-secondary-600">{cert.courseName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">{cert.score}</div>
                    <div className="text-sm text-secondary-500">{cert.date}</div>
                  </div>
                  <div className="ml-4">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      {cert.level}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate Verification */}
      <section className="py-16 md:py-24 bg-primary-700 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Проверка подлинности сертификата
          </h2>
          <p className="text-lg text-primary-200 mb-8">
            Введите номер сертификата или отсканируйте QR-код для проверки подлинности
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Номер сертификата"
                className="flex-1 px-4 py-2 bg-primary-800 border border-primary-600 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="px-6 py-2 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Проверить
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-accent-500 text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Готовы получить свой первый сертификат?
          </h2>
          <p className="text-lg text-accent-100 mb-8">
            Начните изучение корейского языка сегодня и получите официальное подтверждение своих знаний
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-accent-500 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            Выбрать курс
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CertificatesPage;
