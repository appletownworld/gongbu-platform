import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const InstructorsPage: React.FC = () => {
  const instructors = [
    {
      id: 1,
      name: "이소영 (Lee So-young)",
      title: "Основатель и главный преподаватель",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b05b?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3",
      experience: "8 лет",
      students: 3200,
      rating: 4.9,
      specialization: ["Начальный уровень", "K-Pop корейский", "Разговорная речь"],
      languages: ["Корейский (родной)", "Русский (C1)", "Английский (B2)"],
      bio: "Носитель корейского языка из Сеула. Специализируется на обучении начинающих и современном корейском языке. Автор методики изучения через K-Pop.",
      courses: 6,
      certificates: ["TOPIK Level 6", "Сертификат преподавателя корейского языка", "Международный сертификат TESOL"],
      achievements: ["Лучший преподаватель 2024", "Более 3000 студентов", "Автор учебных материалов"]
    },
    {
      id: 2,
      name: "박민수 (Park Min-su)",
      title: "Преподаватель делового корейского",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3",
      experience: "5 лет",
      students: 1800,
      rating: 4.8,
      specialization: ["Деловой корейский", "TOPIK подготовка", "Грамматика"],
      languages: ["Корейский (родной)", "Русский (B2)", "Английский (C1)"],
      bio: "Специалист по деловому корейскому языку. Работал переводчиком в крупных международных компаниях. Эксперт по подготовке к TOPIK.",
      courses: 4,
      certificates: ["MBA в Seoul National University", "TOPIK Level 6", "Сертификат делового переводчика"],
      achievements: ["95% студентов сдают TOPIK", "Эксперт по деловому этикету", "Бывший переводчик Samsung"]
    },
    {
      id: 3,
      name: "김하은 (Kim Ha-eun)",
      title: "Преподаватель культурологии",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3",
      experience: "4 года",
      students: 2100,
      rating: 4.9,
      specialization: ["Корейская культура", "Дорамы", "Современный сленг"],
      languages: ["Корейский (родной)", "Русский (C1)", "Японский (B1)"],
      bio: "Культуролог и лингвист. Помогает понять корейскую культуру через язык. Специалист по современным трендам и молодежному сленгу.",
      courses: 3,
      certificates: ["MA в Korean Studies", "Культурологический сертификат", "Сертификат медиа-аналитика"],
      achievements: ["Эксперт по K-культуре", "Автор культурных гидов", "Консультант дорама-проектов"]
    },
    {
      id: 4,
      name: "최준호 (Choi Jun-ho)",
      title: "Преподаватель произношения",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3",
      experience: "6 лет",
      students: 1500,
      rating: 4.7,
      specialization: ["Произношение", "Фонетика", "Интонация"],
      languages: ["Корейский (родной)", "Русский (B2)", "Английский (B2)"],
      bio: "Фонетист и специалист по произношению. Помогает студентам избавиться от акцента и говорить как носители языка.",
      courses: 2,
      certificates: ["PhD в Фонетике", "Сертификат логопеда", "TOPIK Level 6"],
      achievements: ["Специалист по акценту", "Автор фонетических методик", "Исследователь интонации"]
    }
  ];

  const stats = [
    { label: "Преподавателей", value: instructors.length },
    { label: "Общий опыт", value: `${instructors.reduce((sum, i) => sum + parseInt(i.experience), 0)} лет` },
    { label: "Студентов обучено", value: instructors.reduce((sum, i) => sum + i.students, 0).toLocaleString() },
    { label: "Средний рейтинг", value: (instructors.reduce((sum, i) => sum + i.rating, 0) / instructors.length).toFixed(1) }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <AcademicCapIcon className="h-12 w-12 text-primary-600 mr-4" />
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700">
              Наши <span className="text-accent-500">преподаватели</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto">
            Познакомьтесь с экспертами корейского языка, которые помогут вам достичь ваших целей в изучении.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                <div className="text-2xl font-bold text-primary-700">{stat.value}</div>
                <div className="text-sm text-primary-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructors Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="bg-white border border-secondary-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8"
              >
                {/* Header */}
                <div className="flex items-start mb-6">
                  <img
                    src={instructor.avatar}
                    alt={instructor.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-primary-100 mr-6"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-secondary-800 mb-1">
                      {instructor.name}
                    </h3>
                    <p className="text-primary-600 font-semibold mb-3">{instructor.title}</p>
                    
                    {/* Rating and Stats */}
                    <div className="flex items-center space-x-6 text-sm text-secondary-600">
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="font-semibold">{instructor.rating}</span>
                      </div>
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        <span>{instructor.students.toLocaleString()} студентов</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{instructor.experience} опыта</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-secondary-700 mb-6 leading-relaxed">
                  {instructor.bio}
                </p>

                {/* Specialization */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-secondary-800 mb-3">Специализация:</h4>
                  <div className="flex flex-wrap gap-2">
                    {instructor.specialization.map((spec, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-secondary-800 mb-3 flex items-center">
                    <GlobeAltIcon className="h-4 w-4 mr-2" />
                    Языки:
                  </h4>
                  <div className="space-y-1">
                    {instructor.languages.map((lang, index) => (
                      <div key={index} className="text-sm text-secondary-600">• {lang}</div>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-secondary-800 mb-3 flex items-center">
                    <CheckBadgeIcon className="h-4 w-4 mr-2" />
                    Достижения:
                  </h4>
                  <div className="space-y-1">
                    {instructor.achievements.map((achievement, index) => (
                      <div key={index} className="text-sm text-secondary-600">• {achievement}</div>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="pt-4 border-t border-secondary-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-secondary-600">
                      <span className="font-semibold">{instructor.courses}</span> курсов ведет
                    </div>
                    <button className="flex items-center text-primary-600 hover:text-primary-700 transition-colors text-sm font-semibold">
                      <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-2" />
                      Написать преподавателю
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Team CTA */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <AcademicCapIcon className="h-16 w-16 text-primary-600 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-6">
            Хотите присоединиться к нашей команде?
          </h2>
          <p className="text-lg text-secondary-600 mb-8 max-w-2xl mx-auto">
            Мы всегда ищем талантливых преподавателей корейского языка, которые готовы делиться знаниями и вдохновлять студентов.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
            >
              Подать заявку
            </Link>
            <a
              href="mailto:careers@gongbu.appletownworld.com"
              className="inline-flex items-center justify-center px-6 py-3 border border-secondary-300 text-base font-medium rounded-lg text-secondary-700 bg-white hover:bg-secondary-50 transition-colors duration-200"
            >
              Написать нам
            </a>
          </div>
        </div>
      </section>

      {/* Student Reviews */}
      <section className="py-16 md:py-24 bg-primary-700 text-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Что говорят наши студенты
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Анна, 24 года",
                review: "Ли Со-ен прекрасный преподаватель! Благодаря ее методике K-Pop корейского я наконец начала понимать любимые песни.",
                instructor: "이소영",
                rating: 5
              },
              {
                name: "Дмитрий, 28 лет", 
                review: "Пак Мин-су помог мне подготовиться к TOPIK Level 4. Его объяснения грамматики просто великолепны!",
                instructor: "박민수",
                rating: 5
              },
              {
                name: "Мария, 22 года",
                review: "Ким Ха-ын открыла для меня мир корейской культуры. Теперь я понимаю дорамы на совершенно новом уровне!",
                instructor: "김하은",
                rating: 5
              }
            ].map((review, index) => (
              <div key={index} className="bg-primary-800 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
                  ))}
                </div>
                <p className="text-primary-100 mb-4 italic">"{review.review}"</p>
                <div className="text-sm">
                  <div className="font-semibold text-white">{review.name}</div>
                  <div className="text-primary-300">Студент преподавателя {review.instructor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default InstructorsPage;
