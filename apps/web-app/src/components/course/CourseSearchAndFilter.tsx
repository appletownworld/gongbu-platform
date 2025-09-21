import React, { useState, useEffect } from 'react'
import { useDebounce as useDebounceHook } from '@/hooks/useDebounce'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { Course, CourseCategory, CourseDifficulty } from '@/types/course'
import { useTranslation } from '@/hooks/useTranslation'

interface CourseSearchAndFilterProps {
  courses: Course[]
  onFilteredCourses: (courses: Course[]) => void
  className?: string
}

interface FilterState {
  searchQuery: string
  category: string
  difficulty: string
  priceRange: [number, number]
  duration: string
  language: string
  rating: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const CourseSearchAndFilter: React.FC<CourseSearchAndFilterProps> = ({
  courses,
  onFilteredCourses,
  className = ''
}) => {
  // const { t } = useTranslation()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: '',
    difficulty: '',
    priceRange: [0, 1000],
    duration: '',
    language: '',
    rating: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const debouncedSearchQuery = useDebounceHook(filters.searchQuery, 300)

  // Apply filters whenever filters change
  useEffect(() => {
    const filtered = applyFilters(courses, filters)
    onFilteredCourses(filtered)
  }, [courses, filters, debouncedSearchQuery])

  const applyFilters = (coursesToFilter: Course[], currentFilters: FilterState): Course[] => {
    let filtered = [...coursesToFilter]

    // Search query filter
    if (currentFilters.searchQuery) {
      const query = currentFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (currentFilters.category) {
      filtered = filtered.filter(course => course.category === currentFilters.category)
    }

    // Difficulty filter
    if (currentFilters.difficulty) {
      filtered = filtered.filter(course => course.difficulty === currentFilters.difficulty)
    }

    // Price range filter
    filtered = filtered.filter(course => 
      (course.price || 0) >= currentFilters.priceRange[0] && 
      (course.price || 0) <= currentFilters.priceRange[1]
    )

    // Duration filter
    if (currentFilters.duration) {
      filtered = filtered.filter(course => {
        const duration = course.duration || 0
        switch (currentFilters.duration) {
          case 'short':
            return duration <= 60 // 1 hour
          case 'medium':
            return duration > 60 && duration <= 300 // 1-5 hours
          case 'long':
            return duration > 300 // 5+ hours
          default:
            return true
        }
      })
    }

    // Language filter
    if (currentFilters.language) {
      filtered = filtered.filter(course => course.language === currentFilters.language)
    }

    // Rating filter
    if (currentFilters.rating > 0) {
      filtered = filtered.filter(course => (course.rating || 0) >= currentFilters.rating)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (currentFilters.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case 'students':
          aValue = a.studentCount || 0
          bValue = b.studentCount || 0
          break
        case 'duration':
          aValue = a.duration || 0
          bValue = b.duration || 0
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
      }

      if (currentFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      difficulty: '',
      priceRange: [0, 1000],
      duration: '',
      language: '',
      rating: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.searchQuery) count++
    if (filters.category) count++
    if (filters.difficulty) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++
    if (filters.duration) count++
    if (filters.language) count++
    if (filters.rating > 0) count++
    return count
  }

  const categories = [
    { value: CourseCategory.PROGRAMMING, label: 'Программирование' },
    { value: CourseCategory.DESIGN, label: 'Дизайн' },
    { value: CourseCategory.BUSINESS, label: 'Бизнес' },
    { value: CourseCategory.MARKETING, label: 'Маркетинг' },
    { value: CourseCategory.LANGUAGES, label: 'Языки' },
    { value: CourseCategory.SCIENCE, label: 'Наука' },
    { value: CourseCategory.ARTS, label: 'Искусство' },
    { value: CourseCategory.HEALTH, label: 'Здоровье' },
  ]

  const difficulties = [
    { value: CourseDifficulty.BEGINNER, label: 'Начинающий' },
    { value: CourseDifficulty.INTERMEDIATE, label: 'Средний' },
    { value: CourseDifficulty.ADVANCED, label: 'Продвинутый' },
  ]

  const durations = [
    { value: 'short', label: 'Короткие (до 1 часа)' },
    { value: 'medium', label: 'Средние (1-5 часов)' },
    { value: 'long', label: 'Длинные (5+ часов)' },
  ]

  const languages = [
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'English' },
    { value: 'ko', label: '한국어' },
  ]

  const sortOptions = [
    { value: 'createdAt', label: 'Дата создания' },
    { value: 'title', label: 'Название' },
    { value: 'price', label: 'Цена' },
    { value: 'rating', label: 'Рейтинг' },
    { value: 'students', label: 'Количество студентов' },
    { value: 'duration', label: 'Длительность' },
  ]

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Поиск курсов..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter('searchQuery', '')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle and Sort */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center space-x-2 px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Фильтры</span>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
              {getActiveFiltersCount()}
            </span>
          )}
        </button>

        <div className="flex items-center space-x-4">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                Сортировать по: {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
            title={filters.sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {isFilterOpen && (
        <div className="bg-white border border-secondary-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Категория
              </label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Сложность
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => updateFilter('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Любая сложность</option>
                {difficulties.map(difficulty => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Длительность
              </label>
              <select
                value={filters.duration}
                onChange={(e) => updateFilter('duration', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Любая длительность</option>
                {durations.map(duration => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Язык
              </label>
              <select
                value={filters.language}
                onChange={(e) => updateFilter('language', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Все языки</option>
                {languages.map(language => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Цена: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={filters.priceRange[0]}
                  onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Минимальный рейтинг: {filters.rating}⭐
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.rating}
                onChange={(e) => updateFilter('rating', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={clearFilters}
              className="btn-outline"
            >
              Очистить фильтры
            </button>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.searchQuery && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
              Поиск: "{filters.searchQuery}"
              <button
                onClick={() => updateFilter('searchQuery', '')}
                className="ml-2 text-primary-600 hover:text-primary-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {categories.find(c => c.value === filters.category)?.label}
              <button
                onClick={() => updateFilter('category', '')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.difficulty && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              {difficulties.find(d => d.value === filters.difficulty)?.label}
              <button
                onClick={() => updateFilter('difficulty', '')}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              ${filters.priceRange[0]} - ${filters.priceRange[1]}
              <button
                onClick={() => updateFilter('priceRange', [0, 1000])}
                className="ml-2 text-yellow-600 hover:text-yellow-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.rating > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              {filters.rating}⭐+
              <button
                onClick={() => updateFilter('rating', 0)}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Custom hook for debouncing
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default CourseSearchAndFilter
