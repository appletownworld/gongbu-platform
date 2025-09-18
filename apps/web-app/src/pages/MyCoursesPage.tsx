import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  UsersIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { coursesApi } from '@/services/api'
import { Course } from '@/types/course'

const MyCoursesPage: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  // Fetch user's courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ['my-courses', user?.id],
    queryFn: () => coursesApi.getCourses({ creatorId: user!.id }),
    enabled: !!user?.id,
  })

  const publishMutation = useMutation({
    mutationFn: ({ courseId, action }: { courseId: string; action: 'publish' | 'unpublish' }) =>
      action === 'publish' 
        ? coursesApi.publishCourse(courseId)
        : coursesApi.unpublishCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] })
      toast.success('Статус курса обновлен!')
    },
    onError: (error: any) => {
      toast.error(`Ошибка: ${error.message}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: coursesApi.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] })
      toast.success('Курс удален!')
    },
    onError: (error: any) => {
      toast.error(`Ошибка удаления: ${error.message}`)
    }
  })

  const filteredCourses = courses?.courses?.filter(course => {
    switch (filter) {
      case 'published':
        return course.isPublished
      case 'draft':
        return !course.isPublished
      default:
        return true
    }
  }) || []

  const handleTogglePublish = (course: Course) => {
    publishMutation.mutate({
      courseId: course.id,
      action: course.isPublished ? 'unpublish' : 'publish'
    })
  }

  const handleDeleteCourse = (courseId: string, title: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить курс "${title}"?`)) {
      deleteMutation.mutate(courseId)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary-600">Загрузка ваших курсов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-2">
                Мои курсы
              </h1>
              <p className="text-xl text-secondary-600">
                Управляйте своими образовательными курсами
              </p>
            </div>
            <Link to="/create-course" className="btn-primary flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>Создать курс</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-secondary-700">Фильтр:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'Все курсы' },
                { key: 'published', label: 'Опубликованные' },
                { key: 'draft', label: 'Черновики' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    filter === key
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {courses?.courses && (
            <div className="mt-4 text-sm text-secondary-600">
              Всего курсов: {courses.courses.length} | 
              Опубликованных: {courses.courses.filter(c => c.isPublished).length} | 
              Черновиков: {courses.courses.filter(c => !c.isPublished).length}
            </div>
          )}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="card h-full flex flex-col">
                {/* Course Image */}
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

                {/* Course Info */}
                <div className="flex-1 flex flex-col">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge text-xs ${
                      course.isPublished ? 'badge-success' : 'badge-warning'
                    }`}>
                      {course.isPublished ? 'Опубликован' : 'Черновик'}
                    </span>
                    <span className="badge-secondary text-xs">
                      {course.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-secondary-600 text-sm mb-4 line-clamp-3 flex-1">
                    {course.shortDescription || course.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-secondary-500">
                    <div className="flex items-center space-x-1">
                      <UsersIcon className="h-4 w-4" />
                      <span>{course.enrollmentCount || 0} студентов</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span>{course.averageRating?.toFixed(1) || '0.0'}</span>
                    </div>
                    {course.estimatedDuration && (
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{Math.floor(course.estimatedDuration / 60)}ч</span>
                      </div>
                    )}
                    {course.price && course.price > 0 && (
                      <div className="flex items-center space-x-1">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>{course.price.toLocaleString()} ₽</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-secondary-200">
                      <Link
                        to={`/courses/${course.slug}/edit`}
                        className="btn-primary btn-sm flex-1"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Редактировать
                      </Link>
                      
                      <Link
                        to={`/courses/${course.slug}`}
                        className="btn-outline btn-sm flex-1"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Просмотр
                      </Link>
                    
                    <button
                      onClick={() => handleTogglePublish(course)}
                      disabled={publishMutation.isPending}
                      className={`btn-sm ${
                        course.isPublished 
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } px-3 py-2 rounded-lg transition-colors`}
                      title={course.isPublished ? 'Снять с публикации' : 'Опубликовать'}
                    >
                      {course.isPublished ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      disabled={deleteMutation.isPending}
                      className="btn-sm bg-error-100 text-error-700 hover:bg-error-200 px-3 py-2 rounded-lg transition-colors"
                      title="Удалить курс"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpenIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-700 mb-2">
              {filter === 'all' 
                ? 'У вас пока нет курсов' 
                : filter === 'published'
                ? 'У вас нет опубликованных курсов'
                : 'У вас нет курсов в черновиках'
              }
            </h3>
            <p className="text-secondary-500 mb-6">
              {filter === 'all'
                ? 'Создайте свой первый курс и начните обучать студентов'
                : 'Измените фильтр или создайте новый курс'
              }
            </p>
            {filter === 'all' && (
              <Link to="/create-course" className="btn-primary">
                <PlusIcon className="mr-2 h-4 w-4" />
                Создать первый курс
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyCoursesPage
