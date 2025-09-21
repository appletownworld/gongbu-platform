import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  MicrophoneIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { quizApi } from '@/services/quizApi'
import { 
  Quiz, 
  QuizQuestion, 
  QuizQuestionType, 
  CreateQuizDto,
  CreateQuizQuestionDto,
  CreateQuizOptionDto
} from '@/types/quiz'
import { useTranslation } from '@/hooks/useTranslation'

interface QuizEditorProps {
  courseId: string
  lessonId?: string
  quiz?: Quiz
  onSave?: (quiz: Quiz) => void
  onCancel?: () => void
}

const QuizEditor: React.FC<QuizEditorProps> = ({ 
  courseId, 
  lessonId, 
  quiz, 
  onSave, 
  onCancel 
}) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [quizData, setQuizData] = useState<CreateQuizDto>({
    title: quiz?.title || '',
    description: quiz?.description || '',
    courseId,
    lessonId,
    timeLimit: quiz?.timeLimit || undefined,
    passingScore: quiz?.passingScore || 70,
    maxAttempts: quiz?.maxAttempts || undefined,
    questions: quiz?.questions || []
  })

  const [editingQuestion, setEditingQuestion] = useState<CreateQuizQuestionDto | null>(null)
  const [showQuestionModal, setShowQuestionModal] = useState(false)

  const createQuizMutation = useMutation({
    mutationFn: quizApi.createQuiz,
    onSuccess: (newQuiz) => {
      toast.success(t('common.success') + '!')
      queryClient.invalidateQueries({ queryKey: ['course-quizzes', courseId] })
      onSave?.(newQuiz)
    },
    onError: (error: any) => {
      toast.error(t('errors.unknownError') + ': ' + error.message)
    }
  })

  const updateQuizMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateQuizDto> }) =>
      quizApi.updateQuiz(id, data),
    onSuccess: (updatedQuiz) => {
      toast.success(t('common.success') + '!')
      queryClient.invalidateQueries({ queryKey: ['course-quizzes', courseId] })
      onSave?.(updatedQuiz)
    },
    onError: (error: any) => {
      toast.error(t('errors.unknownError') + ': ' + error.message)
    }
  })

  const handleSave = () => {
    if (!quizData.title.trim()) {
      toast.error(t('validation.required'))
      return
    }

    if (quizData.questions.length === 0) {
      toast.error('Добавьте хотя бы один вопрос')
      return
    }

    if (quiz) {
      updateQuizMutation.mutate({ id: quiz.id, data: quizData })
    } else {
      createQuizMutation.mutate(quizData)
    }
  }

  const addQuestion = () => {
    const newQuestion: CreateQuizQuestionDto = {
      question: '',
      type: QuizQuestionType.MULTIPLE_CHOICE,
      options: [
        { text: '', isCorrect: false, order: 0 },
        { text: '', isCorrect: false, order: 1 },
        { text: '', isCorrect: false, order: 2 },
        { text: '', isCorrect: false, order: 3 }
      ],
      points: 1,
      order: quizData.questions.length,
      isRequired: true
    }
    setEditingQuestion(newQuestion)
    setShowQuestionModal(true)
  }

  const editQuestion = (question: CreateQuizQuestionDto) => {
    setEditingQuestion(question)
    setShowQuestionModal(true)
  }

  const saveQuestion = (question: CreateQuizQuestionDto) => {
    if (editingQuestion) {
      // Update existing question
      const updatedQuestions = quizData.questions.map(q => 
        q.order === editingQuestion.order ? question : q
      )
      setQuizData(prev => ({ ...prev, questions: updatedQuestions }))
    } else {
      // Add new question
      setQuizData(prev => ({ 
        ...prev, 
        questions: [...prev.questions, question] 
      }))
    }
    setShowQuestionModal(false)
    setEditingQuestion(null)
  }

  const deleteQuestion = (questionOrder: number) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions
        .filter(q => q.order !== questionOrder)
        .map((q, index) => ({ ...q, order: index }))
    }))
  }

  const getQuestionTypeIcon = (type: QuizQuestionType) => {
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
        return DocumentIcon
    }
  }

  const getQuestionTypeLabel = (type: QuizQuestionType) => {
    switch (type) {
      case QuizQuestionType.MULTIPLE_CHOICE:
        return 'Множественный выбор'
      case QuizQuestionType.SINGLE_CHOICE:
        return 'Одиночный выбор'
      case QuizQuestionType.TRUE_FALSE:
        return 'Верно/Неверно'
      case QuizQuestionType.TEXT_INPUT:
        return 'Текстовый ответ'
      case QuizQuestionType.FILE_UPLOAD:
        return 'Загрузка файла'
      case QuizQuestionType.VOICE_RECORDING:
        return 'Голосовая запись'
      default:
        return 'Неизвестный тип'
    }
  }

  return (
    <div className="space-y-6">
      {/* Quiz Basic Info */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          {quiz ? 'Редактировать квиз' : 'Создать квиз'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {t('lesson.lessonTitle')} *
            </label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Введите название квиза"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {t('course.description')}
            </label>
            <textarea
              value={quizData.description}
              onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Описание квиза (необязательно)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Время на выполнение (минуты)
              </label>
              <input
                type="number"
                value={quizData.timeLimit || ''}
                onChange={(e) => setQuizData(prev => ({ 
                  ...prev, 
                  timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Не ограничено"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Проходной балл (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={quizData.passingScore}
                onChange={(e) => setQuizData(prev => ({ 
                  ...prev, 
                  passingScore: parseInt(e.target.value) 
                }))}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Максимум попыток
              </label>
              <input
                type="number"
                value={quizData.maxAttempts || ''}
                onChange={(e) => setQuizData(prev => ({ 
                  ...prev, 
                  maxAttempts: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Не ограничено"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">
            Вопросы ({quizData.questions.length})
          </h3>
          <button
            onClick={addQuestion}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Добавить вопрос</span>
          </button>
        </div>

        {quizData.questions.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-secondary-700 mb-2">
              Пока нет вопросов
            </h4>
            <p className="text-secondary-500 mb-4">
              Добавьте первый вопрос, чтобы создать квиз
            </p>
            <button
              onClick={addQuestion}
              className="btn-primary"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Создать первый вопрос
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizData.questions.map((question, index) => {
              const QuestionIcon = getQuestionTypeIcon(question.type)
              return (
                <div
                  key={question.order}
                  className="bg-secondary-50 rounded-lg p-4 border border-secondary-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-secondary-500 bg-white px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <QuestionIcon className="h-5 w-5 text-secondary-400" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-secondary-900 mb-1">
                          {question.question || 'Без названия'}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-secondary-500">
                          <span>{getQuestionTypeLabel(question.type)}</span>
                          <span className="flex items-center">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            {question.points} балл{question.points !== 1 ? 'ов' : ''}
                          </span>
                          {question.timeLimit && (
                            <span className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {question.timeLimit} мин
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => editQuestion(question)}
                        className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteQuestion(question.order)}
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
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={onCancel}
          className="btn-outline"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={createQuizMutation.isPending || updateQuizMutation.isPending}
          className="btn-primary"
        >
          {createQuizMutation.isPending || updateQuizMutation.isPending 
            ? t('common.loading')
            : t('common.save')
          }
        </button>
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <QuestionEditor
          question={editingQuestion}
          onSave={saveQuestion}
          onCancel={() => {
            setShowQuestionModal(false)
            setEditingQuestion(null)
          }}
        />
      )}
    </div>
  )
}

// Question Editor Component
interface QuestionEditorProps {
  question?: CreateQuizQuestionDto | null
  onSave: (question: CreateQuizQuestionDto) => void
  onCancel: () => void
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onSave, onCancel }) => {
  const { t } = useTranslation()
  const [questionData, setQuestionData] = useState<CreateQuizQuestionDto>(
    question || {
      question: '',
      type: QuizQuestionType.MULTIPLE_CHOICE,
      options: [
        { text: '', isCorrect: false, order: 0 },
        { text: '', isCorrect: false, order: 1 },
        { text: '', isCorrect: false, order: 2 },
        { text: '', isCorrect: false, order: 3 }
      ],
      points: 1,
      order: 0,
      isRequired: true
    }
  )

  const handleSave = () => {
    if (!questionData.question.trim()) {
      toast.error(t('validation.required'))
      return
    }

    if ((questionData.type === QuizQuestionType.MULTIPLE_CHOICE || 
         questionData.type === QuizQuestionType.SINGLE_CHOICE) &&
        (!questionData.options || questionData.options.length < 2)) {
      toast.error('Добавьте минимум 2 варианта ответа')
      return
    }

    onSave(questionData)
  }

  const addOption = () => {
    setQuestionData(prev => ({
      ...prev,
      options: [
        ...(prev.options || []),
        { text: '', isCorrect: false, order: (prev.options?.length || 0) }
      ]
    }))
  }

  const updateOption = (index: number, field: keyof CreateQuizOptionDto, value: any) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options?.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      ) || []
    }))
  }

  const removeOption = (index: number) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index).map((option, i) => ({
        ...option,
        order: i
      })) || []
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            {question ? 'Редактировать вопрос' : 'Добавить вопрос'}
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Текст вопроса *
            </label>
            <textarea
              value={questionData.question}
              onChange={(e) => setQuestionData(prev => ({ ...prev, question: e.target.value }))}
              rows={3}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Введите текст вопроса"
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Тип вопроса
            </label>
            <select
              value={questionData.type}
              onChange={(e) => setQuestionData(prev => ({ 
                ...prev, 
                type: e.target.value as QuizQuestionType 
              }))}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={QuizQuestionType.MULTIPLE_CHOICE}>Множественный выбор</option>
              <option value={QuizQuestionType.SINGLE_CHOICE}>Одиночный выбор</option>
              <option value={QuizQuestionType.TRUE_FALSE}>Верно/Неверно</option>
              <option value={QuizQuestionType.TEXT_INPUT}>Текстовый ответ</option>
              <option value={QuizQuestionType.FILE_UPLOAD}>Загрузка файла</option>
              <option value={QuizQuestionType.VOICE_RECORDING}>Голосовая запись</option>
            </select>
          </div>

          {/* Options for multiple/single choice */}
          {(questionData.type === QuizQuestionType.MULTIPLE_CHOICE || 
            questionData.type === QuizQuestionType.SINGLE_CHOICE) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-secondary-700">
                  Варианты ответов
                </label>
                <button
                  onClick={addOption}
                  className="btn-outline text-sm flex items-center space-x-1"
                >
                  <PlusIcon className="h-3 w-3" />
                  <span>Добавить</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {questionData.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type={questionData.type === QuizQuestionType.MULTIPLE_CHOICE ? 'checkbox' : 'radio'}
                      checked={option.isCorrect}
                      onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(index, 'text', e.target.value)}
                      className="flex-1 p-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={`Вариант ${index + 1}`}
                    />
                    {questionData.options && questionData.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-error-500 hover:bg-error-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Баллы за вопрос
            </label>
            <input
              type="number"
              min="1"
              value={questionData.points}
              onChange={(e) => setQuestionData(prev => ({ 
                ...prev, 
                points: parseInt(e.target.value) 
              }))}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Объяснение (необязательно)
            </label>
            <textarea
              value={questionData.explanation || ''}
              onChange={(e) => setQuestionData(prev => ({ ...prev, explanation: e.target.value }))}
              rows={2}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Объяснение правильного ответа"
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-secondary-200 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="btn-outline"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizEditor
