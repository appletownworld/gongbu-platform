import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  TagIcon,
  GlobeAltIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { Course } from '@/types/course'
import { useTranslation } from '@/hooks/useTranslation'

interface CourseSearchResultsProps {
  courses: Course[]
  loading?: boolean
  className?: string
}

const CourseSearchResults: React.FC<CourseSearchResultsProps> = ({
  courses,
  loading = false,
  className = ''
}) => {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const toggleFavorite = (courseId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(courseId)) {
        newFavorites.delete(courseId)
      } else {
        newFavorites.add(courseId)
      }
      return newFavorites
    })
  }

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}ч ${mins}м`
    }
    return `${mins}м`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800'
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800'
      case 'ADVANCED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'Начинающий'
      case 'INTERMEDIATE':
        return 'Средний'
      case 'ADVANCED':
        return 'Продвинутый'
      default:
        return difficulty
    }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-secondary-200 p-6 animate-pulse">
              <div className="h-48 bg-secondary-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-secondary-200 rounded mb-2"></div>
              <div className="h-4 bg-secondary-200 rounded w-3/4 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-secondary-200 rounded w-1/4"></div>
                <div className="h-4 bg-secondary-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AcademicCapIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-700 mb-2">
          Курсы не найдены
        </h3>
        <p className="text-secondary-500">
          Попробуйте изменить параметры поиска или фильтры
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900">
            Найдено курсов: {courses.length}
          </h2>
          <p className="text-secondary-600">
            Результаты поиска и фильтрации
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-primary-100 text-primary-600' 
                : 'text-secondary-500 hover:bg-secondary-100'
            }`}
            title="Сетка"
          >
            <div className="grid grid-cols-2 gap-1 w-4 h-4">
              <div className="bg-current rounded"></div>
              <div className="bg-current rounded"></div>
              <div className="bg-current rounded"></div>
              <div className="bg-current rounded"></div>
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary-100 text-primary-600' 
                : 'text-secondary-500 hover:bg-secondary-100'
            }`}
            title="Список"
          >
            <div className="space-y-1 w-4 h-4">
              <div className="bg-current rounded h-1"></div>
              <div className="bg-current rounded h-1"></div>
              <div className="bg-current rounded h-1"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Courses Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isFavorite={favorites.has(course.id)}
              onToggleFavorite={() => toggleFavorite(course.id)}
              formatPrice={formatPrice}
              formatDuration={formatDuration}
              getDifficultyColor={getDifficultyColor}
              getDifficultyLabel={getDifficultyLabel}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <CourseListItem
              key={course.id}
              course={course}
              isFavorite={favorites.has(course.id)}
              onToggleFavorite={() => toggleFavorite(course.id)}
              formatPrice={formatPrice}
              formatDuration={formatDuration}
              getDifficultyColor={getDifficultyColor}
              getDifficultyLabel={getDifficultyLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Course Card Component
interface CourseCardProps {
  course: Course
  isFavorite: boolean
  onToggleFavorite: () => void
  formatPrice: (price: number, currency?: string) => string
  formatDuration: (minutes: number) => string
  getDifficultyColor: (difficulty: string) => string
  getDifficultyLabel: (difficulty: string) => string
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isFavorite,
  onToggleFavorite,
  formatPrice,
  formatDuration,
  getDifficultyColor,
  getDifficultyLabel
}) => {
  return (
    <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Course Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AcademicCapIcon className="h-16 w-16 text-primary-400" />
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <HeartIcon className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-secondary-500'}`} />
        </button>

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-secondary-900">
            {(course.price || 0) === 0 ? 'Бесплатно' : formatPrice(course.price || 0)}
          </span>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        {/* Title and Category */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-secondary-900 mb-1 line-clamp-2">
            {course.title}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary-500">{course.category}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
              {getDifficultyLabel(course.difficulty)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-secondary-600 mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <StarIcon className="h-4 w-4 text-yellow-500" />
              <span>{course.rating?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{course.studentCount || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatDuration(course.duration || 0)}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {course.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary-100 text-secondary-700"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            {course.tags.length > 3 && (
              <span className="text-xs text-secondary-500">
                +{course.tags.length - 3} еще
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Link
            to={`/courses/${course.slug}`}
            className="flex-1 btn-primary text-center"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Подробнее
          </Link>
          <button className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            <ShareIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Course List Item Component
interface CourseListItemProps {
  course: Course
  isFavorite: boolean
  onToggleFavorite: () => void
  formatPrice: (price: number, currency?: string) => string
  formatDuration: (minutes: number) => string
  getDifficultyColor: (difficulty: string) => string
  getDifficultyLabel: (difficulty: string) => string
}

const CourseListItem: React.FC<CourseListItemProps> = ({
  course,
  isFavorite,
  onToggleFavorite,
  formatPrice,
  formatDuration,
  getDifficultyColor,
  getDifficultyLabel
}) => {
  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex space-x-6">
        {/* Course Image */}
        <div className="flex-shrink-0">
          <div className="w-32 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg overflow-hidden">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <AcademicCapIcon className="h-8 w-8 text-primary-400" />
              </div>
            )}
          </div>
        </div>

        {/* Course Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                {course.title}
              </h3>
              
              <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
                {course.description}
              </p>

              <div className="flex items-center space-x-4 text-sm text-secondary-500 mb-3">
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span>{course.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{course.studentCount || 0} студентов</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{formatDuration(course.duration || 0)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <GlobeAltIcon className="h-4 w-4" />
                  <span>{course.language}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-secondary-500">{course.category}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                  {getDifficultyLabel(course.difficulty)}
                </span>
                {course.tags && course.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary-100 text-secondary-700"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Price and Actions */}
            <div className="flex flex-col items-end space-y-3">
              <div className="text-right">
                <div className="text-lg font-semibold text-secondary-900">
                  {(course.price || 0) === 0 ? 'Бесплатно' : formatPrice(course.price || 0)}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onToggleFavorite}
                  className="p-2 text-secondary-500 hover:text-red-500 transition-colors"
                >
                  <HeartIcon className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-current' : ''}`} />
                </button>
                <button className="p-2 text-secondary-500 hover:text-primary-600 transition-colors">
                  <ShareIcon className="h-4 w-4" />
                </button>
                <Link
                  to={`/courses/${course.slug}`}
                  className="btn-primary"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Подробнее
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseSearchResults
