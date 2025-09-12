import React from 'react'
import { Link } from 'react-router-dom'
import { 
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  UsersIcon,
  StarIcon,
  CheckIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { coursesApi } from '@/services/api'

const HomePage: React.FC = () => {
  // Fetch popular courses
  const { data: popularCourses, isLoading } = useQuery({
    queryKey: ['popular-courses'],
    queryFn: () => coursesApi.getCourses({ limit: 6, isPublished: true }),
  })

  const features = [
    {
      icon: BookOpenIcon,
      title: 'Качественные курсы',
      description: 'Курсы от опытных преподавателей с практическими заданиями и реальными проектами'
    },
    {
      icon: ChartBarIcon,
      title: 'Отслеживание прогресса',
      description: 'Следите за своим прогрессом, получайте достижения и сертификаты о завершении'
    },
    {
      icon: UsersIcon,
      title: 'Сообщество',
      description: 'Общайтесь с единомышленниками, участвуйте в дискуссиях и получайте поддержку'
    },
    {
      icon: AcademicCapIcon,
      title: 'Сертификаты',
      description: 'Получайте официальные сертификаты о завершении курсов для вашего портфолио'
    }
  ]

  const stats = [
    { label: 'Студентов', value: '10,000+' },
    { label: 'Курсов', value: '500+' },
    { label: 'Преподавателей', value: '100+' },
    { label: 'Завершений', value: '25,000+' },
  ]

  const testimonials = [
    {
      name: 'Анна Петрова',
      role: 'Frontend разработчик',
      content: 'Благодаря Gongbu я смогла освоить React и найти работу мечты. Курсы структурированы отлично!',
      avatar: '👩‍💻'
    },
    {
      name: 'Михаил Сидоров',
      role: 'Python разработчик', 
      content: 'Отличная платформа для изучения программирования. Преподаватели объясняют сложные вещи простым языком.',
      avatar: '👨‍💻'
    },
    {
      name: 'Елена Козлова',
      role: 'UX/UI дизайнер',
      content: 'Курсы по дизайну помогли мне систематизировать знания и улучшить навыки работы с инструментами.',
      avatar: '🎨'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container-custom section-spacing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Изучайте 
                  <span className="block text-yellow-300">программирование</span>
                  с лучшими
                </h1>
                <p className="text-xl md:text-2xl text-primary-100 leading-relaxed">
                  Современная образовательная платформа с практическими курсами, 
                  интерактивными заданиями и поддержкой сообщества
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/courses" className="btn-primary bg-white text-primary-600 hover:bg-secondary-50 px-8 py-4 text-lg">
                  Начать обучение
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <button className="btn-outline border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg">
                  <PlayIcon className="mr-2 h-5 w-5" />
                  Посмотреть демо
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-primary-500">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                      {stat.value}
                    </div>
                    <div className="text-sm text-primary-200">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative lg:ml-8">
              <div className="aspect-square bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-3xl shadow-2xl flex items-center justify-center">
                <div className="text-6xl md:text-8xl">🎓</div>
              </div>
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-300 rounded-xl flex items-center justify-center text-2xl animate-bounce-soft">
                📚
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-400 rounded-xl flex items-center justify-center text-2xl animate-bounce-soft" style={{ animationDelay: '0.5s' }}>
                💻
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
              Почему выбирают Gongbu?
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Мы создали платформу, которая делает обучение эффективным, 
              интересным и доступным для каждого
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="section-spacing bg-secondary-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
              Популярные курсы
            </h2>
            <p className="text-xl text-secondary-600">
              Начните с наших самых востребованных курсов
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton h-48 mb-4"></div>
                  <div className="skeleton h-6 mb-2"></div>
                  <div className="skeleton h-4 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="skeleton h-4 w-16"></div>
                    <div className="skeleton h-8 w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularCourses?.courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.slug}`}
                  className="card-hover group"
                >
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center">
                      <BookOpenIcon className="h-16 w-16 text-primary-400" />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="badge-primary">{course.category}</span>
                    <span className="badge-secondary">{course.difficulty}</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>
                  
                  <p className="text-secondary-600 mb-4 line-clamp-2">
                    {course.shortDescription || course.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-secondary-500">
                      <div className="flex items-center space-x-1">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span>{course.averageRating}</span>
                      </div>
                      <span>👥 {course.enrollmentCount}</span>
                    </div>
                    <div className="text-right">
                      {course.price && course.price > 0 ? (
                        <span className="text-lg font-bold text-primary-600">
                          {course.price} ₽
                        </span>
                      ) : (
                        <span className="badge-success">Бесплатно</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/courses" className="btn-primary px-8 py-3">
              Посмотреть все курсы
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-spacing bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
              Что говорят наши студенты
            </h2>
            <p className="text-xl text-secondary-600">
              Истории успеха тех, кто уже достиг своих целей с Gongbu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card text-center">
                <div className="text-4xl mb-4">{testimonial.avatar}</div>
                <blockquote className="text-secondary-600 mb-6 italic">
                  "{testimonial.content}"
                </blockquote>
                <div>
                  <div className="font-semibold text-secondary-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-secondary-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-primary-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Готовы начать обучение?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к тысячам студентов, которые уже изменили свою карьеру 
            благодаря нашим курсам
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses" className="btn-primary bg-white text-primary-600 hover:bg-secondary-50 px-8 py-3">
              Выбрать курс
            </Link>
            <Link to="/about" className="btn-outline border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3">
              Узнать больше
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
