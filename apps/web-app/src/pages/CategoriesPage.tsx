import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  BookOpenIcon,
  BuildingOfficeIcon,
  FilmIcon,
  MusicalNoteIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const CategoriesPage: React.FC = () => {
  const categories = [
    {
      id: 'beginner',
      name: 'Для начинающих',
      description: 'Изучение основ корейского языка с нуля',
      icon: AcademicCapIcon,
      color: 'bg-blue-500',
      courses: 3,
      students: 2847,
      features: ['Алфавит хангыль', 'Базовая грамматика', 'Простые фразы', 'Числа и время'],
      level: 'Начинающий'
    },
    {
      id: 'speaking',
      name: 'Разговорный корейский',
      description: 'Развитие навыков устной речи и понимания на слух',
      icon: SpeakerWaveIcon,
      color: 'bg-green-500',
      courses: 2,
      students: 1672,
      features: ['Диалоги', 'Произношение', 'Аудирование', 'Живая речь'],
      level: 'Средний'
    },
    {
      id: 'grammar',
      name: 'Грамматика',
      description: 'Углубленное изучение корейской грамматики',
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      courses: 2,
      students: 934,
      features: ['Окончания', 'Времена', 'Вежливые формы', 'Сложные конструкции'],
      level: 'Средний-продвинутый'
    },
    {
      id: 'culture',
      name: 'K-Pop и культура',
      description: 'Изучение языка через корейскую культуру и музыку',
      icon: MusicalNoteIcon,
      color: 'bg-pink-500',
      courses: 2,
      students: 1523,
      features: ['Тексты песен', 'Современный сленг', 'Культурные особенности', 'Модные выражения'],
      level: 'Средний'
    },
    {
      id: 'business',
      name: 'Деловой корейский',
      description: 'Корейский язык для работы и бизнеса',
      icon: BuildingOfficeIcon,
      color: 'bg-indigo-500',
      courses: 1,
      students: 287,
      features: ['Деловая лексика', 'Переговоры', 'Документооборот', 'Бизнес-этикет'],
      level: 'Продвинутый'
    },
    {
      id: 'media',
      name: 'Дорамы и фильмы',
      description: 'Понимание корейских дорам и фильмов без субтитров',
      icon: FilmIcon,
      color: 'bg-red-500',
      courses: 1,
      students: 1156,
      features: ['Живой язык', 'Эмоциональные выражения', 'Сленг', 'Культурный контекст'],
      level: 'Средний-продвинутый'
    },
    {
      id: 'exam',
      name: 'Подготовка к TOPIK',
      description: 'Подготовка к экзамену на знание корейского языка',
      icon: BookOpenIcon,
      color: 'bg-orange-500',
      courses: 1,
      students: 721,
      features: ['Все разделы TOPIK', 'Пробные тесты', 'Стратегии сдачи', 'Практика'],
      level: 'Средний-продвинутый'
    },
    {
      id: 'travel',
      name: 'Корейский для путешествий',
      description: 'Практические фразы для поездок в Корею',
      icon: GlobeAltIcon,
      color: 'bg-cyan-500',
      courses: 1,
      students: 1672,
      features: ['Фразы в отеле', 'В ресторане', 'Транспорт', 'Экстренные ситуации'],
      level: 'Начинающий-средний'
    }
  ];

  const stats = {
    totalCategories: categories.length,
    totalCourses: categories.reduce((sum, cat) => sum + cat.courses, 0),
    totalStudents: categories.reduce((sum, cat) => sum + cat.students, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-secondary-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center bg-white shadow-sm">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-700 mb-6 leading-tight animate-fade-in-down">
            Категории <span className="text-accent-500">курсов</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary-700 mb-8 max-w-2xl mx-auto animate-fade-in-up">
            Выберите направление изучения корейского языка, которое подходит именно вам. От основ до специализированных навыков.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary-700">{stats.totalCategories}</div>
              <div className="text-sm text-primary-600">Категорий</div>
            </div>
            <div className="bg-accent-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-accent-700">{stats.totalCourses}</div>
              <div className="text-sm text-accent-600">Курсов</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">{stats.totalStudents.toLocaleString()}</div>
              <div className="text-sm text-green-600">Студентов</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-lg border border-secondary-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
              >
                {/* Category Header */}
                <div className={`h-2 ${category.color}`}></div>
                
                <div className="p-8">
                  {/* Icon and Title */}
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${category.color} bg-opacity-10 mr-4`}>
                      <category.icon className={`h-8 w-8 ${category.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-800">{category.name}</h3>
                      <span className="text-sm text-secondary-500">{category.level}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-secondary-600 mb-6 leading-relaxed">
                    {category.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center text-sm text-secondary-500 mb-6 space-x-6">
                    <div className="flex items-center">
                      <BookOpenIcon className="h-4 w-4 mr-1" />
                      {category.courses} курсов
                    </div>
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {category.students.toLocaleString()} студентов
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-secondary-800 mb-3">Что изучаете:</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.features.map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs px-3 py-1 bg-secondary-100 text-secondary-600 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    to={`/courses?category=${category.id}`}
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-secondary-800 hover:bg-secondary-900 transition-colors duration-200 group-hover:bg-primary-600"
                  >
                    Смотреть курсы
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-4">
              Рекомендованный путь изучения
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Следуйте этому плану для наиболее эффективного изучения корейского языка
            </p>
          </div>

          <div className="space-y-8">
            {/* Beginner Level */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-secondary-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">1</div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-800">Начальный уровень</h3>
                  <p className="text-sm text-secondary-500">0-6 месяцев</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/courses?category=beginner" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="font-semibold text-blue-800">Для начинающих</div>
                  <div className="text-sm text-blue-600">Основы языка</div>
                </Link>
                <Link to="/courses?category=travel" className="p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors">
                  <div className="font-semibold text-cyan-800">Для путешествий</div>
                  <div className="text-sm text-cyan-600">Практические фразы</div>
                </Link>
                <div className="p-4 bg-secondary-50 rounded-lg opacity-50">
                  <div className="font-semibold text-secondary-600">Письменность</div>
                  <div className="text-sm text-secondary-500">Скоро</div>
                </div>
              </div>
            </div>

            {/* Intermediate Level */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-secondary-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">2</div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-800">Средний уровень</h3>
                  <p className="text-sm text-secondary-500">6-18 месяцев</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/courses?category=speaking" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="font-semibold text-green-800">Разговорный</div>
                  <div className="text-sm text-green-600">Устная речь</div>
                </Link>
                <Link to="/courses?category=grammar" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="font-semibold text-purple-800">Грамматика</div>
                  <div className="text-sm text-purple-600">Сложные формы</div>
                </Link>
                <Link to="/courses?category=culture" className="p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
                  <div className="font-semibold text-pink-800">K-Pop</div>
                  <div className="text-sm text-pink-600">Культура и музыка</div>
                </Link>
              </div>
            </div>

            {/* Advanced Level */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-secondary-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">3</div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-800">Продвинутый уровень</h3>
                  <p className="text-sm text-secondary-500">18+ месяцев</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/courses?category=business" className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                  <div className="font-semibold text-indigo-800">Деловой</div>
                  <div className="text-sm text-indigo-600">Работа и бизнес</div>
                </Link>
                <Link to="/courses?category=exam" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <div className="font-semibold text-orange-800">TOPIK</div>
                  <div className="text-sm text-orange-600">Подготовка к экзамену</div>
                </Link>
                <Link to="/courses?category=media" className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <div className="font-semibold text-red-800">Дорамы</div>
                  <div className="text-sm text-red-600">Понимание фильмов</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary-700 text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Готовы начать изучение?
          </h2>
          <p className="text-lg text-primary-200 mb-8">
            Выберите категорию и начните свой путь в изучении корейского языка уже сегодня
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-base font-medium rounded-full shadow-lg text-primary-700 bg-white hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Посмотреть все курсы <ArrowRightIcon className="ml-3 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CategoriesPage;
