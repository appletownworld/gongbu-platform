import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayIcon,
  PauseIcon,
  DocumentTextIcon,
  PhotoIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline'
import { quizApi } from '@/services/quizApi'
import { 
  Quiz, 
  QuizAttempt, 
  QuizQuestion, 
  QuizQuestionType,
  QuizAnswer
} from '@/types/quiz'
import { useTranslation } from '@/hooks/useTranslation'

interface QuizPlayerProps {
  quizId: string
  onComplete?: (attempt: QuizAttempt) => void
  onExit?: () => void
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizId, onComplete, onExit }) => {
  const { t } = useTranslation()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())

  // Fetch quiz data
  const { data: quizResponse, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizApi.getQuiz(quizId),
  })

  const quiz = quizResponse?.quiz

  // Start quiz attempt
  const startAttemptMutation = useMutation({
    mutationFn: () => quizApi.startQuizAttempt(quizId),
    onSuccess: (attempt) => {
      if (quiz?.timeLimit) {
        setTimeRemaining(quiz.timeLimit * 60) // Convert to seconds
      }
      setStartTime(Date.now())
    }
  })

  // Submit quiz attempt
  const submitAttemptMutation = useMutation({
    mutationFn: (attemptId: string) => {
      const quizAnswers: QuizAnswer[] = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        isCorrect: false, // Will be calculated on server
        points: 0,
        timeSpent: 0
      }))
      return quizApi.submitQuizAttempt(attemptId, quizAnswers)
    },
    onSuccess: (attempt) => {
      toast.success('Квиз завершен!')
      onComplete?.(attempt)
    },
    onError: (error: any) => {
      toast.error('Ошибка при отправке квиза: ' + error.message)
    }
  })

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || isPaused) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - auto submit
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, isPaused])

  // Start quiz on mount
  useEffect(() => {
    if (quiz && !startAttemptMutation.data) {
      startAttemptMutation.mutate()
    }
  }, [quiz])

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    if (startAttemptMutation.data) {
      submitAttemptMutation.mutate(startAttemptMutation.data.id)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getQuestionIcon = (type: QuizQuestionType) => {
    switch (type) {
      case QuizQuestionType.MULTIPLE_CHOICE:
      case QuizQuestionType.SINGLE_CHOICE:
        return CheckCircleIcon
      case QuizQuestionType.TEXT_INPUT:
        return DocumentTextIcon
      case QuizQuestionType.FILE_UPLOAD:
        return PhotoIcon
      case QuizQuestionType.VOICE_RECORDING:
        return MicrophoneIcon
      default:
        return DocumentTextIcon
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Квиз не найден</h2>
          <button onClick={onExit} className="btn-primary">
            Вернуться
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const QuestionIcon = getQuestionIcon(currentQuestion.type)

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-10">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onExit}
                className="flex items-center space-x-2 text-secondary-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Выйти</span>
              </button>
              
              <div className="h-6 w-px bg-secondary-300" />
              
              <h1 className="text-lg font-semibold text-secondary-900">
                {quiz.title}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Timer */}
              {timeRemaining !== null && (
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  timeRemaining < 300 ? 'bg-error-100 text-error-700' : 'bg-primary-100 text-primary-700'
                }`}>
                  <ClockIcon className="h-4 w-4" />
                  <span className="font-mono font-medium">
                    {formatTime(timeRemaining)}
                  </span>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="ml-2 p-1 hover:bg-white/50 rounded"
                  >
                    {isPaused ? (
                      <PlayIcon className="h-3 w-3" />
                    ) : (
                      <PauseIcon className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}

              {/* Progress */}
              <div className="text-sm text-secondary-600">
                {currentQuestionIndex + 1} / {quiz.questions.length}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-8">
            {/* Question Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                <QuestionIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-secondary-500 mb-1">
                  Вопрос {currentQuestionIndex + 1} из {quiz.questions.length}
                </div>
                <h2 className="text-xl font-semibold text-secondary-900">
                  {currentQuestion.question}
                </h2>
              </div>
            </div>

            {/* Question Content */}
            <div className="mb-8">
              {currentQuestion.type === QuizQuestionType.MULTIPLE_CHOICE && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-3 p-4 border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={answers[currentQuestion.id]?.includes(option.id) || false}
                        onChange={(e) => {
                          const currentAnswers = answers[currentQuestion.id] || []
                          if (e.target.checked) {
                            handleAnswerChange(currentQuestion.id, [...currentAnswers, option.id])
                          } else {
                            handleAnswerChange(currentQuestion.id, currentAnswers.filter((id: string) => id !== option.id))
                          }
                        }}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="flex-1 text-secondary-900">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === QuizQuestionType.SINGLE_CHOICE && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-3 p-4 border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={answers[currentQuestion.id] === option.id}
                        onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                        className="border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="flex-1 text-secondary-900">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === QuizQuestionType.TRUE_FALSE && (
                <div className="space-y-3">
                  {[
                    { id: 'true', text: 'Верно' },
                    { id: 'false', text: 'Неверно' }
                  ].map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center space-x-3 p-4 border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={answers[currentQuestion.id] === option.id}
                        onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                        className="border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="flex-1 text-secondary-900">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === QuizQuestionType.TEXT_INPUT && (
                <div>
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Введите ваш ответ..."
                  />
                </div>
              )}

              {currentQuestion.type === QuizQuestionType.FILE_UPLOAD && (
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center">
                  <PhotoIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600 mb-4">Загрузите файл с ответом</p>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleAnswerChange(currentQuestion.id, file)
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="btn-primary cursor-pointer"
                  >
                    Выбрать файл
                  </label>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-secondary-200">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentQuestionIndex === 0 
                    ? 'text-secondary-400 cursor-not-allowed' 
                    : 'text-primary-600 hover:bg-primary-50'
                }`}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Предыдущий</span>
              </button>

              <div className="flex items-center space-x-2">
                {currentQuestionIndex === quiz.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitAttemptMutation.isPending}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>
                      {submitAttemptMutation.isPending ? 'Отправка...' : 'Завершить квиз'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>Следующий</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizPlayer
