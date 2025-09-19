import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  ArrowLeftIcon,
  PlusIcon,
  BookOpenIcon,
  PlayIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { coursesApi } from '@/services/api'
import { Lesson, LessonContentType } from '@/types/course'
// useAuth import removed - not used

interface CreateLessonDto {
  title: string
  slug?: string
  content: string
  contentType: LessonContentType
  videoUrl?: string
  audioUrl?: string
  order: number
  duration?: number
  isPreview: boolean
  courseId: string
}

const CourseEditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  // const navigate = useNavigate() // Unused
  const queryClient = useQueryClient()
  // const { user } = useAuth() // Unused
  
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'settings'>('content')
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  
  // New lesson form state
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    contentType: LessonContentType.TEXT,
    videoUrl: '',
    audioUrl: '',
    duration: '',
    isPreview: false
  })

  // Fetch course data
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => coursesApi.getCourseBySlug(slug!),
    enabled: !!slug,
  })

  // Fetch course lessons
  const { data: lessons } = useQuery({
    queryKey: ['course-lessons', course?.id],
    queryFn: () => coursesApi.getLessons(course!.id),
    enabled: !!course?.id,
  })

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: (lessonData: CreateLessonDto) => coursesApi.createLesson(lessonData),
    onSuccess: () => {
      toast.success('Урок создан!')
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] })
      setShowLessonModal(false)
      resetLessonForm()
    },
    onError: (error: any) => {
      toast.error(`Ошибка создания урока: ${error.message}`)
    }
  })

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CreateLessonDto>) =>
      coursesApi.updateLesson(id, data),
    onSuccess: () => {
      toast.success('Урок обновлен!')
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] })
      setEditingLesson(null)
      setShowLessonModal(false)
      resetLessonForm()
    }
  })

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: coursesApi.deleteLesson,
    onSuccess: () => {
      toast.success('Урок удален!')
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] })
    }
  })

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      content: '',
      contentType: LessonContentType.TEXT,
      videoUrl: '',
      audioUrl: '',
      duration: '',
      isPreview: false
    })
  }

  const handleCreateLesson = () => {
    if (!course || !lessonForm.title.trim()) {
      toast.error('Укажите название урока')
      return
    }

    const lessonData: CreateLessonDto = {
      title: lessonForm.title,
      content: lessonForm.content,
      contentType: lessonForm.contentType,
      videoUrl: lessonForm.videoUrl || undefined,
      audioUrl: lessonForm.audioUrl || undefined,
      duration: lessonForm.duration ? parseInt(lessonForm.duration) : undefined,
      isPreview: lessonForm.isPreview,
      order: (lessons?.length || 0) + 1,
      courseId: course.id
    }

    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, ...lessonData })
    } else {
      createLessonMutation.mutate(lessonData)
    }
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      contentType: lesson.contentType,
      videoUrl: lesson.videoUrl || '',
      audioUrl: lesson.audioUrl || '',
      duration: lesson.duration?.toString() || '',
      isPreview: false // lesson.isPreview not in interface - using default
    })
    setShowLessonModal(true)
  }

  const handleDeleteLesson = (lesson: Lesson) => {
    if (window.confirm(`Удалить урок "${lesson.title}"?`)) {
      deleteLessonMutation.mutate(lesson.id)
    }
  }

  const getContentTypeIcon = (type: LessonContentType) => {
    switch (type) {
      case 'VIDEO': return PlayIcon
      case 'AUDIO': return MicrophoneIcon
      case 'INTERACTIVE': return CheckCircleIcon
      default: return DocumentTextIcon
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-secondary-600">Загрузка редактора...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Курс не найден</h2>
          <Link to="/my-courses" className="btn-primary">
            Вернуться к курсам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/my-courses"
            className="flex items-center text-secondary-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Мои курсы
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                Редактирование: {course.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-secondary-500">
                <span className="flex items-center">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  {lessons?.length || 0} уроков
                </span>
                <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                  {course.isPublished ? 'Опубликован' : 'Черновик'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/courses/${course.slug}`}
                className="btn-outline flex items-center space-x-2"
              >
                <EyeIcon className="h-4 w-4" />
                <span>Предварительный просмотр</span>
              </Link>
              
              {course.isPublished && (
                <a
                  href={`https://t.me/gongbu_platform_bot`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center space-x-2"
                >
                  <GlobeAltIcon className="h-4 w-4" />
                  <span>Открыть бота</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 mb-8">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'content', label: 'Контент курса', icon: BookOpenIcon },
                { key: 'info', label: 'Информация', icon: DocumentTextIcon },
                { key: 'settings', label: 'Настройки', icon: PencilIcon },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Content Tab */}
            {activeTab === 'content' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Уроки курса
                  </h2>
                  <button
                    onClick={() => {
                      resetLessonForm()
                      setEditingLesson(null)
                      setShowLessonModal(true)
                    }}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Добавить урок</span>
                  </button>
                </div>

                {/* Lessons List */}
                {lessons && lessons.length > 0 ? (
                  <div className="space-y-4">
                    {lessons.map((lesson: Lesson, index: number) => {
                      const ContentIcon = getContentTypeIcon(lesson.contentType)
                      return (
                        <div
                          key={lesson.id}
                          className="bg-secondary-50 rounded-lg p-4 border border-secondary-200 hover:border-primary-200 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-secondary-500 bg-white px-2 py-1 rounded">
                                  {index + 1}
                                </span>
                                <ContentIcon className="h-5 w-5 text-secondary-400" />
                              </div>
                              
                              <div>
                                <h3 className="font-medium text-secondary-900">
                                  {lesson.title}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-secondary-500 mt-1">
                                  <span>{lesson.contentType}</span>
                                  {lesson.duration && (
                                    <span className="flex items-center">
                                      <ClockIcon className="h-3 w-3 mr-1" />
                                      {lesson.duration} мин
                                    </span>
                                  )}
                                  {lesson.isFree && (
                                    <span className="badge badge-secondary text-xs">Бесплатный</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditLesson(lesson)}
                                className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Редактировать"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteLesson(lesson)}
                                disabled={deleteLessonMutation.isPending}
                                className="p-2 text-secondary-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                title="Удалить"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpenIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                      Пока нет уроков
                    </h3>
                    <p className="text-secondary-500 mb-6">
                      Добавьте первый урок, чтобы начать создавать контент курса
                    </p>
                    <button
                      onClick={() => setShowLessonModal(true)}
                      className="btn-primary"
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Создать первый урок
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Info Tab */}
            {activeTab === 'info' && (
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 mb-6">
                  Информация о курсе
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Название курса
                    </label>
                    <input
                      type="text"
                      value={course.title}
                      disabled
                      className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50 text-secondary-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Описание
                    </label>
                    <textarea
                      value={course.description}
                      disabled
                      rows={4}
                      className="w-full p-3 border border-secondary-300 rounded-lg bg-secondary-50 text-secondary-600"
                    />
                  </div>
                  
                  <div className="text-center py-4">
                    <p className="text-secondary-500 mb-4">
                      Для редактирования основной информации перейдите на страницу курса
                    </p>
                    <Link to={`/courses/${course.slug}`} className="btn-outline">
                      Редактировать информацию
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 mb-6">
                  Настройки курса
                </h2>
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-2">
                      🚧 В разработке
                    </h3>
                    <p className="text-yellow-700">
                      Расширенные настройки курса будут доступны в следующих обновлениях.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Modal */}
        {showLessonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-secondary-200">
                <h2 className="text-xl font-semibold text-secondary-900">
                  {editingLesson ? 'Редактировать урок' : 'Добавить новый урок'}
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Lesson Title */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Название урока *
                  </label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Введение в React"
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Тип контента
                  </label>
                  <select
                    value={lessonForm.contentType}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, contentType: e.target.value as LessonContentType }))}
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="TEXT">📝 Текст</option>
                    <option value="VIDEO">🎥 Видео</option>
                    <option value="AUDIO">🎵 Аудио</option>
                    <option value="INTERACTIVE">✅ Интерактивный</option>
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Содержание урока *
                  </label>
                  <textarea
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Введите содержание урока..."
                    rows={8}
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Поддерживается Markdown и HTML форматирование
                  </p>
                </div>

                {/* Video URL */}
                {lessonForm.contentType === 'VIDEO' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Ссылка на видео
                    </label>
                    <input
                      type="url"
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}

                {/* Audio URL */}
                {lessonForm.contentType === 'AUDIO' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Ссылка на аудио
                    </label>
                    <input
                      type="url"
                      value={lessonForm.audioUrl}
                      onChange={(e) => setLessonForm(prev => ({ ...prev, audioUrl: e.target.value }))}
                      placeholder="https://example.com/audio.mp3"
                      className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Длительность (в минутах)
                  </label>
                  <input
                    type="number"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="15"
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Preview Lesson */}
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonForm.isPreview}
                      onChange={(e) => setLessonForm(prev => ({ ...prev, isPreview: e.target.checked }))}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-secondary-700">Бесплатный урок (доступен всем)</span>
                  </label>
                </div>
              </div>
              
              <div className="p-6 border-t border-secondary-200 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowLessonModal(false)
                    setEditingLesson(null)
                    resetLessonForm()
                  }}
                  className="btn-outline"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateLesson}
                  disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                  className="btn-primary"
                >
                  {createLessonMutation.isPending || updateLessonMutation.isPending 
                    ? (editingLesson ? 'Сохраняем...' : 'Создаем...')
                    : (editingLesson ? 'Сохранить изменения' : 'Создать урок')
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseEditorPage
