import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlayIcon,
  BookOpenIcon,
  ClockIcon,
  UsersIcon,
  StarIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ShareIcon,
  HeartIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
// HeartSolidIcon import removed - not used
import { coursesApi, progressApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const CourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview')
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())

  // Fetch course data
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => coursesApi.getCourseBySlug(slug!),
    enabled: !!slug,
  })

  // Fetch user progress if authenticated
  const { data: progress } = useQuery({
    queryKey: ['progress', user?.id, course?.id],
    queryFn: () => progressApi.getStudentProgress(user!.id, course!.id),
    enabled: !!user?.id && !!course?.id,
  })

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: (data: { userId: string; courseId: string; enrollmentType: 'FREE' | 'PAID' }) =>
      progressApi.enrollInCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', user?.id, course?.id] })
      toast.success('Вы успешно записались на курс!')
      navigate(`/learn/${course?.slug}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка записи на курс')
    },
  })

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    if (!course || !user) return

    const enrollmentType = course.price && course.price > 0 ? 'PAID' : 'FREE'
    
    if (enrollmentType === 'PAID') {
      // Redirect to payment page
      navigate(`/payment/${course.id}`)
      return
    }

    enrollMutation.mutate({
      userId: user.id,
      courseId: course.id,
      enrollmentType,
    })
  }

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedModules(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary-600">Загрузка курса...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Курс не найден</h1>
          <p className="text-secondary-600 mb-6">Запрашиваемый курс не существует или был удален</p>
          <Link to="/courses" className="btn-primary">
            Вернуться к курсам
          </Link>
        </div>
      </div>
    )
  }

  const isEnrolled = !!progress
  const isCompleted = progress?.status === 'COMPLETED'

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <span className="badge-primary">{course.category.replace('_', ' ')}</span>
                <span className="badge-secondary">{course.difficulty}</span>
                {course.isPremium && <span className="badge-warning">Premium</span>}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                {course.title}
              </h1>

              <p className="text-xl text-secondary-600 mb-6">
                {course.shortDescription || course.description}
              </p>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-secondary-500 mb-6">
                <div className="flex items-center space-x-2">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">{course.averageRating.toFixed(1)}</span>
                  <span>({course.reviewCount} отзывов)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>{course.enrollmentCount} студентов</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpenIcon className="h-4 w-4" />
                  <span>{course.lessonCount} уроков</span>
                </div>
                {course.estimatedDuration && (
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>{Math.floor(course.estimatedDuration / 60)} часов</span>
                  </div>
                )}
              </div>

              {/* Author Info */}
              {course.creator && (
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    {course.creator.avatar ? (
                      <img 
                        src={course.creator.avatar} 
                        alt={course.creator.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary-600 font-semibold text-lg">
                        {course.creator.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">
                      {course.creator.name}
                    </p>
                    <p className="text-sm text-secondary-500">Преподаватель</p>
                  </div>
                </div>
              )}

              {/* Progress Bar for Enrolled Users */}
              {isEnrolled && progress && (
                <div className="bg-primary-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary-800">
                      Ваш прогресс
                    </span>
                    <span className="text-sm text-primary-600">
                      {progress.progressPercentage}%
                    </span>
                  </div>
                  <div className="progress progress-primary mb-2">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${progress.progressPercentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-primary-600">
                    {progress.completedLessons} из {progress.totalLessons} уроков завершено
                  </div>
                </div>
              )}
            </div>

            {/* Course Preview & Enrollment */}
            <div className="lg:col-span-1">
              <div className="card sticky top-8">
                {/* Course Image/Preview */}
                <div className="relative mb-6">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                      <BookOpenIcon className="h-16 w-16 text-primary-400" />
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg hover:bg-opacity-40 transition-all">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <PlayIcon className="h-8 w-8 text-primary-600 ml-1" />
                    </div>
                  </button>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  {course.price && course.price > 0 ? (
                    <div>
                      <span className="text-3xl font-bold text-secondary-900">
                        {course.price.toLocaleString()} ₽
                      </span>
                      <div className="text-sm text-secondary-500 mt-1">
                        Единоразовая оплата
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-success-600">
                        Бесплатно
                      </span>
                      <div className="text-sm text-secondary-500 mt-1">
                        Полный доступ ко всем материалам
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                  {isEnrolled ? (
                    <>
                      {isCompleted ? (
                        <div className="text-center">
                          <div className="inline-flex items-center space-x-2 text-success-600 mb-3">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span className="font-medium">Курс завершен</span>
                          </div>
                          <Link 
                            to={`/certificates/${course.id}`}
                            className="btn-success w-full"
                          >
                            Получить сертификат
                          </Link>
                        </div>
                      ) : (
                        <Link 
                          to={`/learn/${course.slug}`}
                          className="btn-primary w-full"
                        >
                          <PlayIcon className="mr-2 h-4 w-4" />
                          Продолжить обучение
                        </Link>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrollMutation.isPending}
                      className="btn-primary w-full"
                    >
                      {enrollMutation.isPending ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="spinner"></div>
                          <span>Запись...</span>
                        </div>
                      ) : course.price && course.price > 0 ? (
                        'Купить курс'
                      ) : (
                        'Записаться бесплатно'
                      )}
                    </button>
                  )}

                  {/* Secondary Actions */}
                  <div className="flex space-x-2">
                    <button className="btn-outline flex-1">
                      <HeartIcon className="mr-2 h-4 w-4" />
                      В избранное
                    </button>
                    <button className="btn-outline flex-1">
                      <ShareIcon className="mr-2 h-4 w-4" />
                      Поделиться
                    </button>
                  </div>
                </div>

                {/* Course Includes */}
                <div className="border-t border-secondary-200 pt-6">
                  <h4 className="font-semibold text-secondary-900 mb-4">
                    Что включено:
                  </h4>
                  <ul className="space-y-2 text-sm text-secondary-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 flex-shrink-0" />
                      <span>{course.lessonCount} видеоуроков</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 flex-shrink-0" />
                      <span>Практические задания</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 flex-shrink-0" />
                      <span>Сертификат о завершении</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 flex-shrink-0" />
                      <span>Пожизненный доступ</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 flex-shrink-0" />
                      <span>Доступ с мобильного</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content Tabs */}
      <div className="container-custom py-8">
        {/* Tab Navigation */}
        <div className="border-b border-secondary-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Обзор' },
              { id: 'curriculum', label: 'Программа' },
              { id: 'reviews', label: 'Отзывы' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Course Description */}
                <div className="card">
                  <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                    О курсе
                  </h3>
                  <div className="prose prose-secondary max-w-none">
                    <p className="text-secondary-600 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>

                {/* Learning Objectives */}
                <div className="card">
                  <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                    Что вы изучите
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Основы программирования на Python',
                      'Работа с данными и базами данных',
                      'Создание веб-приложений с Flask',
                      'Тестирование и отладка кода',
                      'Развертывание приложений',
                      'Best practices и стиль кода',
                    ].map((objective, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircleIcon className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prerequisites */}
                <div className="card">
                  <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                    Требования
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-secondary-400 mt-1">•</span>
                      <span className="text-secondary-700">Базовые знания компьютера</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-secondary-400 mt-1">•</span>
                      <span className="text-secondary-700">Желание изучать программирование</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-secondary-400 mt-1">•</span>
                      <span className="text-secondary-700">Никакого опыта в Python не требуется</span>
                    </li>
                  </ul>
                </div>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="card">
                    <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                      Теги
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <span key={index} className="badge-secondary">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="card">
                <h3 className="text-xl font-semibold text-secondary-900 mb-6">
                  Программа курса
                </h3>
                
                {/* Mock Curriculum */}
                <div className="space-y-4">
                  {[
                    {
                      title: 'Введение в Python',
                      lessons: [
                        { title: 'Что такое Python и зачем он нужен', duration: '15:30', free: true },
                        { title: 'Установка Python и среды разработки', duration: '12:45', free: true },
                        { title: 'Первая программа на Python', duration: '18:20', free: false },
                        { title: 'Основы синтаксиса', duration: '22:10', free: false },
                      ]
                    },
                    {
                      title: 'Основы программирования',
                      lessons: [
                        { title: 'Переменные и типы данных', duration: '25:15', free: false },
                        { title: 'Операторы и выражения', duration: '20:30', free: false },
                        { title: 'Условные конструкции', duration: '30:45', free: false },
                        { title: 'Циклы и итерации', duration: '35:20', free: false },
                      ]
                    },
                    {
                      title: 'Структуры данных',
                      lessons: [
                        { title: 'Списки и кортежи', duration: '28:15', free: false },
                        { title: 'Словари и множества', duration: '32:40', free: false },
                        { title: 'Работа со строками', duration: '24:55', free: false },
                      ]
                    }
                  ].map((module, moduleIndex) => (
                    <div key={moduleIndex} className="border border-secondary-200 rounded-lg">
                      <button
                        onClick={() => toggleModule(moduleIndex)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary-50 transition-colors"
                      >
                        <div>
                          <h4 className="font-medium text-secondary-900">
                            {module.title}
                          </h4>
                          <p className="text-sm text-secondary-500 mt-1">
                            {module.lessons.length} уроков
                          </p>
                        </div>
                        {expandedModules.has(moduleIndex) ? (
                          <ChevronUpIcon className="h-5 w-5 text-secondary-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-secondary-400" />
                        )}
                      </button>

                      {expandedModules.has(moduleIndex) && (
                        <div className="border-t border-secondary-200">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lessonIndex}
                              className="flex items-center justify-between p-4 border-b border-secondary-100 last:border-b-0"
                            >
                              <div className="flex items-center space-x-3">
                                {lesson.free ? (
                                  <PlayIcon className="h-4 w-4 text-success-500" />
                                ) : (
                                  <LockClosedIcon className="h-4 w-4 text-secondary-400" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-secondary-900">
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-secondary-500 mt-1">
                                    <span>{lesson.duration}</span>
                                    {lesson.free && <span className="badge-success text-xs">Бесплатно</span>}
                                  </div>
                                </div>
                              </div>
                              
                              {isEnrolled && (
                                <div className="text-success-500">
                                  <CheckCircleIcon className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Reviews Summary */}
                <div className="card">
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-secondary-900 mb-1">
                        {course.averageRating.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon 
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(course.averageRating) 
                                ? 'text-yellow-400' 
                                : 'text-secondary-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-secondary-500">
                        {course.reviewCount} отзывов
                      </div>
                    </div>
                    
                    {/* Rating Breakdown */}
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-1 w-12">
                            <span className="text-sm">{rating}</span>
                            <StarIcon className="h-3 w-3 text-yellow-400" />
                          </div>
                          <div className="flex-1 bg-secondary-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full" 
                              style={{ width: `${Math.random() * 80 + 10}%` }}
                            />
                          </div>
                          <span className="text-sm text-secondary-500 w-8">
                            {Math.floor(Math.random() * 50)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-4">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="card">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {['А', 'М', 'Е'][index]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-secondary-900">
                              {['Анна П.', 'Михаил С.', 'Екатерина К.'][index]}
                            </span>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon 
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < [5, 4, 5][index] 
                                      ? 'text-yellow-400' 
                                      : 'text-secondary-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-secondary-500">
                              {['2 недели назад', '1 месяц назад', '3 дня назад'][index]}
                            </span>
                          </div>
                          <p className="text-secondary-700">
                            {[
                              'Отличный курс для начинающих! Все объясняется очень понятно и доступно. Много практики.',
                              'Хорошая структура материала, но хотелось бы больше практических заданий.',
                              'Преподаватель объясняет отлично. Курс действительно стоящий, рекомендую!'
                            ][index]}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Courses */}
            <div className="card">
              <h4 className="font-semibold text-secondary-900 mb-4">
                Похожие курсы
              </h4>
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="w-16 h-12 bg-primary-100 rounded flex-shrink-0"></div>
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-secondary-900 mb-1">
                        {['JavaScript с нуля', 'React для начинающих', 'Node.js разработка'][index]}
                      </h5>
                      <div className="flex items-center space-x-2 text-xs text-secondary-500">
                        <StarIcon className="h-3 w-3 text-yellow-400" />
                        <span>4.8</span>
                        <span>•</span>
                        <span>2,340 студентов</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Stats */}
            <div className="card">
              <h4 className="font-semibold text-secondary-900 mb-4">
                Статистика курса
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Создан:</span>
                  <span className="text-secondary-900">
                    {new Date(course.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Обновлен:</span>
                  <span className="text-secondary-900">
                    {new Date(course.updatedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Язык:</span>
                  <span className="text-secondary-900">{course.language === 'ru' ? 'Русский' : course.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Уровень:</span>
                  <span className="text-secondary-900">{course.difficulty}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetailPage
