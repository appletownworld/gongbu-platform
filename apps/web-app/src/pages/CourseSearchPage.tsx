import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { coursesApi } from '@/services/api'
import { Course } from '@/types/course'
import CourseSearchAndFilter from '@/components/course/CourseSearchAndFilter'
import CourseSearchResults from '@/components/course/CourseSearchResults'
import { useTranslation } from '@/hooks/useTranslation'

const CourseSearchPage: React.FC = () => {
  const { t } = useTranslation()
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])

  // Fetch all courses
  const { data: coursesResponse, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getCourses(),
  })

  const courses = coursesResponse?.courses || []

  // Update filtered courses when courses change
  useEffect(() => {
    if (courses && courses.length > 0) {
      setFilteredCourses(courses)
    }
  }, [courses])

  const handleFilteredCourses = (courses: Course[]) => {
    setFilteredCourses(courses)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            Ошибка загрузки курсов
          </h2>
          <p className="text-secondary-600 mb-4">
            Не удалось загрузить список курсов
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Поиск курсов
          </h1>
          <p className="text-secondary-600">
            Найдите идеальный курс для изучения новых навыков
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <CourseSearchAndFilter
            courses={courses || []}
            onFilteredCourses={handleFilteredCourses}
          />
        </div>

        {/* Search Results */}
        <CourseSearchResults
          courses={filteredCourses}
          loading={isLoading}
        />

        {/* Popular Categories */}
        {!isLoading && courses && courses.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">
              Популярные категории
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: 'Программирование', icon: '💻', count: courses.filter((c: Course) => c.category === 'PROGRAMMING').length },
                { name: 'Дизайн', icon: '🎨', count: courses.filter((c: Course) => c.category === 'DESIGN').length },
                { name: 'Бизнес', icon: '💼', count: courses.filter((c: Course) => c.category === 'BUSINESS').length },
                { name: 'Маркетинг', icon: '📈', count: courses.filter((c: Course) => c.category === 'MARKETING').length },
                { name: 'Языки', icon: '🌍', count: courses.filter((c: Course) => c.category === 'LANGUAGES').length },
                { name: 'Наука', icon: '🔬', count: courses.filter((c: Course) => c.category === 'SCIENCE').length },
              ].map((category) => (
                <div
                  key={category.name}
                  className="bg-white rounded-lg border border-secondary-200 p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h3 className="font-medium text-secondary-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-secondary-500">
                    {category.count} курсов
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Courses */}
        {!isLoading && courses && courses.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">
              Рекомендуемые курсы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter((course: Course) => course.rating && course.rating >= 4.5)
                .slice(0, 6)
                .map((course: Course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-lg border border-secondary-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <span className="text-4xl">📚</span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-secondary-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-sm font-medium">
                            {course.rating?.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-primary-600">
                          {course.price === 0 ? 'Бесплатно' : `$${course.price}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            Не нашли подходящий курс?
          </h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            Создайте свой собственный курс и поделитесь знаниями с другими студентами
          </p>
          <button className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
            Создать курс
          </button>
        </div>
      </div>
    </div>
  )
}

export default CourseSearchPage
