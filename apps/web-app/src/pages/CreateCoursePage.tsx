import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  BookOpenIcon, 
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { coursesApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { CourseCategory, CourseDifficulty } from '@/types/course'
import { ImageUpload, UploadResult } from '@/components/FileUpload'
import { fileUploadService } from '@/services/fileUploadApi'

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '' as CourseCategory,
    difficulty: '' as CourseDifficulty,
    language: 'ru',
    estimatedDuration: '',
    price: '',
    currency: 'RUB',
    isPremium: false,
    coverImageUrl: '',
    thumbnailUrl: '',
    tags: [] as string[],
    metaTitle: '',
    metaDescription: ''
  })
  
  // Состояние для загруженных файлов
  const [uploadedCover, setUploadedCover] = useState<UploadResult | null>(null)
  const [uploadedThumbnail, setUploadedThumbnail] = useState<UploadResult | null>(null)
  
  const [tagInput, setTagInput] = useState('')
  const [currentStep, setCurrentStep] = useState(1)

  const createCourseMutation = useMutation({
    mutationFn: coursesApi.createCourse,
    onSuccess: (course) => {
      toast.success('Курс успешно создан!')
      navigate(`/courses/${course.slug}`)
    },
    onError: (error: any) => {
      toast.error(`Ошибка создания курса: ${error.message || 'Неизвестная ошибка'}`)
    }
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      toast.error('Необходимо войти в систему')
      return
    }

    const courseData = {
      ...formData,
      creatorId: user.id,
      estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      // Используем URL загруженных файлов или оставляем текущие URL из formData
      coverImageUrl: uploadedCover?.url || formData.coverImageUrl,
      thumbnailUrl: uploadedThumbnail?.url || formData.thumbnailUrl,
    }

    // Убираем пустые поля
    Object.keys(courseData).forEach(key => {
      if (courseData[key as keyof typeof courseData] === '' || courseData[key as keyof typeof courseData] === undefined) {
        delete courseData[key as keyof typeof courseData]
      }
    })

    createCourseMutation.mutate(courseData)
  }

  // Обработчики загрузки файлов
  const handleCoverUpload = async (files: File[]): Promise<UploadResult[]> => {
    try {
      const result = await fileUploadService.uploadFile({
        file: files[0],
        context: 'course-cover',
        isPublic: true,
      })
      
      setUploadedCover(result)
      toast.success('Обложка курса загружена!')
      return [result]
    } catch (error) {
      console.error('Cover upload failed:', error)
      throw error
    }
  }

  const handleThumbnailUpload = async (files: File[]): Promise<UploadResult[]> => {
    try {
      const result = await fileUploadService.uploadFile({
        file: files[0],
        context: 'course-thumbnail',
        isPublic: true,
      })
      
      setUploadedThumbnail(result)
      toast.success('Миниатюра курса загружена!')
      return [result]
    } catch (error) {
      console.error('Thumbnail upload failed:', error)
      throw error
    }
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
    [CourseCategory.SCIENCE]: 'Наука',
    [CourseCategory.ARTS]: 'Искусство',
    [CourseCategory.HEALTH]: 'Здоровье',
    [CourseCategory.OTHER]: 'Другое',
  }

  const difficultyLabels: Record<CourseDifficulty, string> = {
    [CourseDifficulty.BEGINNER]: 'Начинающий',
    [CourseDifficulty.INTERMEDIATE]: 'Средний',
    [CourseDifficulty.ADVANCED]: 'Продвинутый',
    [CourseDifficulty.EXPERT]: 'Эксперт',
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.title.length >= 3 && formData.description.length >= 10
      case 2:
        return formData.category && formData.difficulty
      case 3:
        return true // Optional fields
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-secondary-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Назад
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-2">
            Создать новый курс
          </h1>
          <p className="text-xl text-secondary-600">
            Поделитесь своими знаниями с миром
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: 'Основная информация', icon: BookOpenIcon },
              { step: 2, title: 'Категория и сложность', icon: TagIcon },
              { step: 3, title: 'Дополнительно', icon: PhotoIcon },
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep === step
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : isStepValid(step) && currentStep > step
                    ? 'bg-success-600 border-success-600 text-white'
                    : 'border-secondary-300 text-secondary-400'
                }`}>
                  {isStepValid(step) && currentStep > step ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`ml-3 text-sm font-medium ${
                  currentStep === step ? 'text-primary-600' : 'text-secondary-500'
                }`}>
                  {title}
                </span>
                {step < 3 && (
                  <div className={`mx-4 h-0.5 w-16 ${
                    currentStep > step ? 'bg-success-600' : 'bg-secondary-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-secondary-900 mb-6">
                  Основная информация о курсе
                </h2>

                {/* Course Title */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Название курса *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Python для начинающих"
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Минимум 3 символа. Сделайте название ярким и запоминающимся.
                  </p>
                </div>

                {/* Course Description */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Полное описание курса *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Подробно опишите, что студенты изучат в вашем курсе..."
                    rows={6}
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Минимум 10 символов. Опишите цели, содержание и результаты курса.
                  </p>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Краткое описание (для превью)
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    placeholder="Изучите Python за 30 дней"
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Краткое описание для каталога курсов (10-300 символов).
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Category and Difficulty */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-secondary-900 mb-6">
                  Категория и сложность
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Категория курса *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value as CourseCategory)}
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Выберите категорию</option>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Уровень сложности *
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value as CourseDifficulty)}
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Выберите сложность</option>
                      {Object.entries(difficultyLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estimated Duration */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Примерная длительность (в минутах)
                  </label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                      placeholder="2400"
                      className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">
                    Например: 2400 минут = 40 часов
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Теги для поиска
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Введите тег и нажмите Enter"
                      className="flex-1 p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="btn-primary"
                    >
                      Добавить
                    </button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-primary-600 hover:text-primary-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Additional Options */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-secondary-900 mb-6">
                  Дополнительные настройки
                </h2>

                {/* Price */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Цена курса (оставьте пустым для бесплатного)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="4999"
                        className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Валюта
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="RUB">RUB</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-secondary-900">Изображения курса</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Course Cover */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-secondary-700">
                        Обложка курса
                      </label>
                      <ImageUpload
                        context="course-cover"
                        aspectRatio="video"
                        onUpload={handleCoverUpload}
                        maxSize={5 * 1024 * 1024} // 5MB
                        className="w-full"
                      />
                      
                      {/* Fallback URL input */}
                      <details className="mt-3">
                        <summary className="text-xs text-secondary-500 cursor-pointer hover:text-secondary-700">
                          Или укажите URL изображения
                        </summary>
                        <div className="mt-2">
                          <input
                            type="url"
                            value={formData.coverImageUrl}
                            onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                            placeholder="https://example.com/course-cover.jpg"
                            className="w-full p-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </details>
                    </div>

                    {/* Course Thumbnail */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-secondary-700">
                        Миниатюра курса
                      </label>
                      <ImageUpload
                        context="course-thumbnail"
                        aspectRatio="video"
                        previewSize="sm"
                        onUpload={handleThumbnailUpload}
                        maxSize={2 * 1024 * 1024} // 2MB
                        className="w-full"
                      />
                      
                      {/* Fallback URL input */}
                      <details className="mt-3">
                        <summary className="text-xs text-secondary-500 cursor-pointer hover:text-secondary-700">
                          Или укажите URL изображения
                        </summary>
                        <div className="mt-2">
                          <input
                            type="url"
                            value={formData.thumbnailUrl}
                            onChange={(e) => handleInputChange('thumbnailUrl', e.target.value)}
                            placeholder="https://example.com/course-thumb.jpg"
                            className="w-full p-2 text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </details>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <PhotoIcon className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Рекомендации по изображениям:</p>
                        <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                          <li><strong>Обложка:</strong> 1280x720px (16:9) для лучшего отображения</li>
                          <li><strong>Миниатюра:</strong> 400x225px (16:9) для превью в списках</li>
                          <li>Используйте яркие, контрастные изображения</li>
                          <li>Избегайте слишком мелкого текста на изображениях</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Course */}
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={(e) => handleInputChange('isPremium', e.target.checked)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">Премиум курс</span>
                  </label>
                  <p className="text-xs text-secondary-500 mt-1">
                    Премиум курсы получают дополнительную видимость в каталоге.
                  </p>
                </div>

                {/* SEO Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-secondary-900">SEO настройки</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      SEO заголовок
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                      placeholder="Python для начинающих - полный курс"
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      SEO описание
                    </label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      placeholder="Изучите программирование на Python с нуля..."
                      rows={3}
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-secondary-200">
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className={`btn-outline ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Назад
              </button>

              <div className="space-x-4">
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!isStepValid(currentStep)}
                    className={`btn-primary ${!isStepValid(currentStep) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Далее
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={createCourseMutation.isPending || !isStepValid(1) || !isStepValid(2)}
                    className={`btn-primary ${createCourseMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {createCourseMutation.isPending ? 'Создание курса...' : 'Создать курс'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCoursePage
