import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpenIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  PlayIcon,
  StarIcon,
  ArrowRightIcon,
  FireIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { progressApi, coursesApi } from '@/services/api'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  // Fetch user courses and progress
  const { data: userCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['user-courses', user?.id],
    queryFn: () => progressApi.getUserCourses(user!.id),
    enabled: !!user?.id,
  })

  // Mock data for achievements and stats
  const achievements = [
    { 
      title: 'Первые шаги', 
      description: 'Завершен первый урок',
      icon: '🚀',
      unlocked: true,
      unlockedAt: '2023-12-01'
    },
    { 
      title: 'Студент недели', 
      description: '7 дней активного обучения',
      icon: '🔥',
      unlocked: true,
      unlockedAt: '2023-12-07'
    },
    { 
      title: 'Знаток Python', 
      description: 'Завершен курс Python',
      icon: '🐍',
      unlocked: false,
      progress: 65
    },
    { 
      title: 'Марафонец', 
      description: '30 дней обучения подряд',
      icon: '🏃‍♀️',
      unlocked: false,
      progress: 23
    },
  ]

  const weeklyStats = {
    hoursLearned: 8.5,
    lessonsCompleted: 12,
    coursesActive: 3,
    streak: 5,
    targetHours: 10,
    targetLessons: 15,
  }

  if (coursesLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary-600">Загрузка панели управления...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-custom py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-2">
            Добро пожаловать, {user?.firstName}! 👋
          </h1>
          <p className="text-xl text-secondary-600">
            Продолжайте свой путь в обучении
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">Активных курсов</p>
                <p className="text-2xl font-bold text-primary-600">
                  {userCourses?.inProgress.length || 0}
                </p>
              </div>
              <BookOpenIcon className="h-8 w-8 text-primary-400" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">Завершено курсов</p>
                <p className="text-2xl font-bold text-success-600">
                  {userCourses?.completed.length || 0}
                </p>
              </div>
              <TrophyIcon className="h-8 w-8 text-success-400" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">Часов на неделе</p>
                <p className="text-2xl font-bold text-warning-600">
                  {weeklyStats.hoursLearned}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-warning-400" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">Дни подряд</p>
                <p className="text-2xl font-bold text-error-600">
                  {weeklyStats.streak} 🔥
                </p>
              </div>
              <FireIcon className="h-8 w-8 text-error-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            {userCourses?.inProgress && userCourses.inProgress.length > 0 ? (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Продолжить обучение
                  </h2>
                  <Link to="/my-courses" className="text-primary-600 hover:text-primary-700 text-sm">
                    Все курсы →
                  </Link>
                </div>

                <div className="space-y-4">
                  {userCourses.inProgress.slice(0, 3).map((course) => (
                    <div key={course.id} className="border border-secondary-200 rounded-lg p-4 hover:border-primary-200 transition-colors">
                      <div className="flex items-center space-x-4">
                        {course.coverImageUrl ? (
                          <img
                            src={course.coverImageUrl}
                            alt={course.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                            <BookOpenIcon className="h-8 w-8 text-primary-400" />
                          </div>
                        )}

                        <div className="flex-1">
                          <h3 className="font-semibold text-secondary-900 mb-1">
                            {course.title}
                          </h3>
                          
                          {/* Progress Bar */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-sm text-secondary-500 mb-1">
                              <span>Прогресс</span>
                              <span>{course.progress?.progressPercentage || 0}%</span>
                            </div>
                            <div className="progress progress-primary">
                              <div 
                                className="progress-bar" 
                                style={{ width: `${course.progress?.progressPercentage || 0}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-secondary-500">
                              {course.progress?.completedLessons || 0} из {course.lessonCount} уроков
                            </div>
                            <Link
                              to={`/courses/${course.slug}`}
                              className="btn-primary btn-sm"
                            >
                              <PlayIcon className="mr-1 h-4 w-4" />
                              Продолжить
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center">
                <BookOpenIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                  Начните свое обучение
                </h3>
                <p className="text-secondary-500 mb-6">
                  Выберите курс и начните изучать новые навыки уже сегодня
                </p>
                <Link to="/courses" className="btn-primary">
                  Выбрать курс
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}

            {/* Weekly Progress */}
            <div className="card">
              <h2 className="text-xl font-semibold text-secondary-900 mb-6">
                Прогресс за неделю
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hours Goal */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-secondary-700">
                      Часы обучения
                    </span>
                    <span className="text-sm text-secondary-500">
                      {weeklyStats.hoursLearned} / {weeklyStats.targetHours} часов
                    </span>
                  </div>
                  <div className="progress progress-primary mb-2">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${(weeklyStats.hoursLearned / weeklyStats.targetHours) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-secondary-500">
                    {weeklyStats.targetHours - weeklyStats.hoursLearned > 0 
                      ? `Осталось ${(weeklyStats.targetHours - weeklyStats.hoursLearned).toFixed(1)} часов до цели`
                      : 'Цель достигнута! 🎉'
                    }
                  </div>
                </div>

                {/* Lessons Goal */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-secondary-700">
                      Уроки
                    </span>
                    <span className="text-sm text-secondary-500">
                      {weeklyStats.lessonsCompleted} / {weeklyStats.targetLessons} уроков
                    </span>
                  </div>
                  <div className="progress progress-success mb-2">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${(weeklyStats.lessonsCompleted / weeklyStats.targetLessons) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-secondary-500">
                    {weeklyStats.targetLessons - weeklyStats.lessonsCompleted > 0 
                      ? `Осталось ${weeklyStats.targetLessons - weeklyStats.lessonsCompleted} уроков до цели`
                      : 'Цель достигнута! 🎉'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Achievements */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">
                  Достижения
                </h3>
                <Link to="/achievements" className="text-primary-600 hover:text-primary-700 text-sm">
                  Все →
                </Link>
              </div>

              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      achievement.unlocked 
                        ? 'bg-success-50 border border-success-200' 
                        : 'bg-secondary-50 border border-secondary-200'
                    }`}
                  >
                    <div className="text-2xl">
                      {achievement.unlocked ? achievement.icon : '🔒'}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${
                        achievement.unlocked ? 'text-success-800' : 'text-secondary-700'
                      }`}>
                        {achievement.title}
                      </div>
                      <div className={`text-xs ${
                        achievement.unlocked ? 'text-success-600' : 'text-secondary-500'
                      }`}>
                        {achievement.description}
                      </div>
                      {!achievement.unlocked && achievement.progress && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-secondary-500 mb-1">
                            <span>Прогресс</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <div className="progress">
                            <div 
                              className="progress-bar bg-secondary-400" 
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Быстрые действия
              </h3>
              
              <div className="space-y-3">
                <Link to="/courses" className="btn-outline w-full justify-start">
                  <BookOpenIcon className="mr-2 h-4 w-4" />
                  Найти новый курс
                </Link>
                
                <Link to="/progress" className="btn-outline w-full justify-start">
                  <ChartBarIcon className="mr-2 h-4 w-4" />
                  Мой прогресс
                </Link>
                
                <Link to="/certificates" className="btn-outline w-full justify-start">
                  <TrophyIcon className="mr-2 h-4 w-4" />
                  Сертификаты
                </Link>
                
                <Link to="/settings" className="btn-outline w-full justify-start">
                  ⚙️ Настройки
                </Link>
              </div>
            </div>

            {/* Learning Tip */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl p-6">
              <h4 className="font-semibold mb-2">💡 Совет дня</h4>
              <p className="text-sm text-primary-100 mb-4">
                Занимайтесь каждый день хотя бы 15 минут - это более эффективно, 
                чем долгие редкие сессии.
              </p>
              <Link to="/tips" className="text-sm text-white underline hover:no-underline">
                Больше советов →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
