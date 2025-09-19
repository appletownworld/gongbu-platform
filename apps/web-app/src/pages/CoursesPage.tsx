import React, { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { coursesApi } from '@/services/api'
import { Course, CourseCategory, CourseDifficulty } from '@/types/course'
// clsx import removed - not used

const CoursesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  
  // Get filters from URL params
  const filters = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    search: searchParams.get('search') || '',
    category: searchParams.get('category') as CourseCategory | undefined,
    difficulty: searchParams.get('difficulty') as CourseDifficulty | undefined,
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    isPremium: searchParams.get('isPremium') ? searchParams.get('isPremium') === 'true' : undefined,
  }), [searchParams])

  // Fetch courses
  const { data, isLoading, error } = useQuery({
    queryKey: ['courses', filters],
    queryFn: () => coursesApi.getCourses({
      ...filters,
      isPublished: true,
      limit: 12,
    }),
  })

  // Update URL params
  const updateFilters = (newFilters: Record<string, string | number | boolean | undefined>) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    
    // Reset page when filters change (except when changing page itself)
    if (!newFilters.page) {
      params.delete('page')
    }
    
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const categoryLabels: Record<CourseCategory, string> = {
    [CourseCategory.PROGRAMMING]: 'Программирование',
    [CourseCategory.WEB_DEVELOPMENT]: 'Веб-разработка',
    [CourseCategory.MOBILE_DEVELOPMENT]: 'Мобильная разработка',
    [CourseCategory.DATA_SCIENCE]: 'Data Science',
    [CourseCategory.DEVOPS]: 'DevOps',
    [CourseCategory.DESIGN]: 'Дизайн',
    [CourseCategory.BUSINESS]: 'Бизнес',
    [CourseCategory.MARKETING]: 'Маркетинг',
    [CourseCategory.LANGUAGES]: 'Языки',
    [CourseCategory.OTHER]: 'Другое',
  }

  const difficultyLabels: Record<CourseDifficulty, string> = {
    [CourseDifficulty.BEGINNER]: 'Начинающий',
    [CourseDifficulty.INTERMEDIATE]: 'Средний',
    [CourseDifficulty.ADVANCED]: 'Продвинутый',
    [CourseDifficulty.EXPERT]: 'Эксперт',
  }

  const hasActiveFilters = filters.search || filters.category || filters.difficulty || 
    filters.minPrice || filters.maxPrice || filters.isPremium

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            Каталог курсов
          </h1>
          <p className="text-xl text-secondary-600">
            Найдите идеальный курс для изучения новых навыков
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Поиск по названию курса, описанию или тегам..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-secondary-600 hover:text-primary-600 transition-colors"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Фильтры</span>
              {hasActiveFilters && (
                <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                  Активны
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-error-600 hover:text-error-700 transition-colors"
              >
                Очистить фильтры
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t border-secondary-200 pt-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Категория
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => updateFilters({ 
                      category: e.target.value || undefined 
                    })}
                    className="w-full p-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Все категории</option>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Сложность
                  </label>
                  <select
                    value={filters.difficulty || ''}
                    onChange={(e) => updateFilters({ 
                      difficulty: e.target.value || undefined 
                    })}
                    className="w-full p-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Любая сложность</option>
                    {Object.entries(difficultyLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Цена от (₽)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice || ''}
                    onChange={(e) => updateFilters({ 
                      minPrice: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Цена до (₽)
                  </label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={filters.maxPrice || ''}
                    onChange={(e) => updateFilters({ 
                      maxPrice: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full p-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Premium Filter */}
              <div className="mt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.isPremium === true}
                    onChange={(e) => updateFilters({ 
                      isPremium: e.target.checked ? true : undefined 
                    })}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-700">Только премиум курсы</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-8">
          {isLoading ? (
            <div className="text-center text-secondary-600">
              <div className="spinner mx-auto mb-4"></div>
              Загрузка курсов...
            </div>
          ) : error ? (
            <div className="text-center text-error-600">
              Ошибка загрузки курсов. Попробуйте обновить страницу.
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-secondary-600">
                  Найдено {data?.pagination.totalItems || 0} курсов
                  {hasActiveFilters && ' по вашим фильтрам'}
                </p>
                
                {/* Sort Options */}
                <select
                  className="p-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  defaultValue="popular"
                >
                  <option value="popular">По популярности</option>
                  <option value="newest">Сначала новые</option>
                  <option value="price-low">Сначала дешевые</option>
                  <option value="price-high">Сначала дорогие</option>
                  <option value="rating">По рейтингу</option>
                </select>
              </div>

              {/* Course Grid */}
              {data?.courses && data.courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {data.courses.map((course: Course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpenIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                    Курсы не найдены
                  </h3>
                  <p className="text-secondary-500 mb-4">
                    Попробуйте изменить фильтры или поисковый запрос
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="btn-primary"
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <nav className="flex space-x-2">
                    {data.pagination.hasPrev && (
                      <button
                        onClick={() => updateFilters({ page: data.pagination.page - 1 })}
                        className="px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                      >
                        Назад
                      </button>
                    )}
                    
                    <span className="px-4 py-2 bg-primary-100 text-primary-600 rounded-lg font-medium">
                      {data.pagination.page} из {data.pagination.totalPages}
                    </span>
                    
                    {data.pagination.hasNext && (
                      <button
                        onClick={() => updateFilters({ page: data.pagination.page + 1 })}
                        className="px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                      >
                        Далее
                      </button>
                    )}
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Course Card Component
const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="card-hover group h-full flex flex-col"
    >
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
        {/* Tags */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="badge-primary text-xs">
            {course.category.replace('_', ' ')}
          </span>
          <span className="badge-secondary text-xs">
            {course.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-secondary-600 text-sm mb-4 line-clamp-3 flex-1">
          {course.shortDescription || course.description}
        </p>

        {/* Meta Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-secondary-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <span>{course.averageRating.toFixed(1)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <UsersIcon className="h-4 w-4" />
                <span>{course.enrollmentCount}</span>
              </div>
            </div>
            {course.estimatedDuration && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>{Math.floor(course.estimatedDuration / 60)}ч</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-right">
              {course.price && course.price > 0 ? (
                <span className="text-lg font-bold text-primary-600">
                  {course.price.toLocaleString()} ₽
                </span>
              ) : (
                <span className="badge-success">Бесплатно</span>
              )}
            </div>
            <div className="text-sm text-secondary-500">
              {course.lessonCount} уроков
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CoursesPage
