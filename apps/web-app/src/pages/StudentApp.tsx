import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  BookOpenIcon, 
  PlayIcon, 
  CheckCircleIcon, 
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  UserIcon,
  MicrophoneIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { coursesApi } from '@/services/api'

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready(): void
        expand(): void
        close(): void
        MainButton: {
          setText(text: string): void
          show(): void
          hide(): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
        }
        BackButton: {
          show(): void
          hide(): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
        }
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            photo_url?: string
          }
        }
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
        }
      }
    }
  }
}

const StudentApp: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  // const [isLessonCompleted, setIsLessonCompleted] = useState(false) // Unused variable

  // Telegram WebApp initialization
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      
      // Apply Telegram theme
      if (tg.themeParams.bg_color) {
        document.body.style.backgroundColor = tg.themeParams.bg_color
      }
      
      return () => {
        tg.BackButton.hide()
        tg.MainButton.hide()
      }
    }
  }, [])

  // Get Telegram user data
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['student-course', slug],
    queryFn: () => coursesApi.getCourseBySlug(slug!),
    enabled: !!slug,
  })

  // Fetch course lessons
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['student-lessons', course?.id],
    queryFn: () => coursesApi.getLessons(course!.id),
    enabled: !!course?.id,
  })

  // Complete lesson mutation
  const completeLessonMutation = useMutation({
    mutationFn: async (_lessonId: string) => {
      // Mock API call - in real implementation this would call progressApi
      return new Promise(resolve => setTimeout(resolve, 1000))
    },
    onSuccess: (_, lessonId) => {
      setCompletedLessons(prev => new Set(prev).add(lessonId))
      // setIsLessonCompleted(true) // Unused function
    }
  })

  // Current lesson
  const currentLesson = lessons?.[currentLessonIndex]
  const isCurrentLessonCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false

  // Configure Telegram buttons
  useEffect(() => {
    if (!window.Telegram?.WebApp || !currentLesson) return

    const tg = window.Telegram.WebApp
    
    // Back button
    if (currentLessonIndex > 0) {
      tg.BackButton.show()
      const backHandler = () => setCurrentLessonIndex(prev => prev - 1)
      tg.BackButton.onClick(backHandler)
      
      return () => {
        tg.BackButton.offClick(backHandler)
      }
    } else {
      tg.BackButton.hide()
    }
  }, [currentLessonIndex, currentLesson])

  useEffect(() => {
    if (!window.Telegram?.WebApp || !currentLesson) return

    const tg = window.Telegram.WebApp
    
    // Main button
    if (isCurrentLessonCompleted) {
      if (currentLessonIndex < (lessons?.length || 0) - 1) {
        tg.MainButton.setText('Следующий урок →')
        const nextHandler = () => {
          setCurrentLessonIndex(prev => prev + 1)
          // setIsLessonCompleted(false) // Unused function
        }
        tg.MainButton.onClick(nextHandler)
        tg.MainButton.show()
        
        return () => {
          tg.MainButton.offClick(nextHandler)
        }
      } else {
        tg.MainButton.setText('🎉 Курс завершен!')
        const finishHandler = () => tg.close()
        tg.MainButton.onClick(finishHandler)
        tg.MainButton.show()
        
        return () => {
          tg.MainButton.offClick(finishHandler)
        }
      }
    } else {
      tg.MainButton.setText('✅ Завершить урок')
      const completeHandler = () => {
        completeLessonMutation.mutate(currentLesson.id)
      }
      tg.MainButton.onClick(completeHandler)
      tg.MainButton.show()
      
      return () => {
        tg.MainButton.offClick(completeHandler)
      }
    }
  }, [currentLessonIndex, isCurrentLessonCompleted, currentLesson, lessons, completeLessonMutation])

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'VIDEO': return PlayIcon
      case 'AUDIO': return MicrophoneIcon
      case 'INTERACTIVE': return CheckCircleIcon
      default: return DocumentTextIcon
    }
  }

  if (courseLoading || lessonsLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Загрузка курса...</p>
        </div>
      </div>
    )
  }

  if (!course || !lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpenIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Курс не найден</h2>
          <p className="text-secondary-500">Проверьте ссылку или обратитесь к автору курса</p>
        </div>
      </div>
    )
  }

  const progress = ((completedLessons.size) / lessons.length) * 100
  const ContentIcon = getContentIcon(currentLesson?.contentType || 'TEXT')

  return (
    <div className="min-h-screen bg-white">
      {/* Header with progress */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold truncate pr-2">
            {course.title}
          </h1>
          <div className="flex items-center space-x-2">
            {telegramUser?.photo_url ? (
              <img 
                src={telegramUser.photo_url} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border-2 border-white"
              />
            ) : (
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Прогресс курса</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-primary-500 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="text-sm opacity-90">
          Урок {currentLessonIndex + 1} из {lessons.length} • {completedLessons.size} завершено
        </div>
      </div>

      {/* Lesson content */}
      {currentLesson && (
        <div className="p-4">
          {/* Lesson header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg ${
                isCurrentLessonCompleted 
                  ? 'bg-success-100 text-success-600' 
                  : 'bg-primary-100 text-primary-600'
              }`}>
                {isCurrentLessonCompleted ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : (
                  <ContentIcon className="h-6 w-6" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
                  <span className="bg-secondary-100 px-2 py-1 rounded text-xs font-medium">
                    {currentLesson.contentType}
                  </span>
                  {currentLesson.duration && (
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-3 w-3" />
                      <span>{currentLesson.duration} мин</span>
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-secondary-900">
                  {currentLesson.title}
                </h2>
              </div>
            </div>
            
            {isCurrentLessonCompleted && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 text-success-700">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="font-medium">Урок завершен!</span>
                </div>
              </div>
            )}
          </div>

          {/* Lesson content based on type */}
          <div className="mb-8">
            {currentLesson.contentType === 'VIDEO' && currentLesson.videoUrl && (
              <div className="mb-6">
                <div className="aspect-video bg-secondary-900 rounded-lg overflow-hidden">
                  <iframe
                    src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title={currentLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}
            
            {currentLesson.contentType === 'AUDIO' && currentLesson.audioUrl && (
              <div className="mb-6 bg-secondary-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <MicrophoneIcon className="h-6 w-6 text-primary-600" />
                  <span className="font-medium text-secondary-900">Аудио материал</span>
                </div>
                <audio 
                  controls 
                  className="w-full"
                  src={currentLesson.audioUrl}
                >
                  Ваш браузер не поддерживает аудио элемент.
                </audio>
              </div>
            )}

            {/* Text content */}
            <div className="prose prose-sm max-w-none text-secondary-900">
              {currentLesson.content.split('\n').map((paragraph: string, index: number) => (
                <p key={index} className="mb-3 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Desktop navigation fallback */}
          {!window.Telegram?.WebApp && (
            <div className="flex items-center justify-between pt-6 border-t border-secondary-200">
              <button
                onClick={() => currentLessonIndex > 0 && setCurrentLessonIndex(prev => prev - 1)}
                disabled={currentLessonIndex === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentLessonIndex === 0 
                    ? 'text-secondary-400 cursor-not-allowed' 
                    : 'text-primary-600 hover:bg-primary-50'
                }`}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Предыдущий</span>
              </button>
              
              <div className="text-sm text-secondary-500">
                {currentLessonIndex + 1} / {lessons.length}
              </div>
              
              <div className="flex space-x-2">
                {!isCurrentLessonCompleted && (
                  <button
                    onClick={() => completeLessonMutation.mutate(currentLesson.id)}
                    disabled={completeLessonMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>
                      {completeLessonMutation.isPending ? 'Сохранение...' : 'Завершить'}
                    </span>
                  </button>
                )}
                
                {isCurrentLessonCompleted && currentLessonIndex < lessons.length - 1 && (
                  <button
                    onClick={() => {
                      setCurrentLessonIndex(prev => prev + 1)
                      // setIsLessonCompleted(false) // Unused function
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
                  >
                    <span>Далее</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Course completion message */}
          {isCurrentLessonCompleted && currentLessonIndex === lessons.length - 1 && (
            <div className="text-center bg-gradient-to-r from-success-50 to-primary-50 rounded-xl p-6 border border-success-200">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">Поздравляем!</h3>
              <p className="text-secondary-600 mb-4">
                Вы успешно завершили курс "{course.title}"
              </p>
              {!window.Telegram?.WebApp && (
                <button 
                  onClick={() => window.close()}
                  className="btn-primary"
                >
                  Завершить обучение
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StudentApp