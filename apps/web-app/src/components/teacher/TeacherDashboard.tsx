import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { teacherApi } from '@/services/quizApi'
import { AssignmentSubmission, QuizAttempt, StudentProgressSummary } from '@/types/quiz'
import { DocumentIcon } from '@heroicons/react/24/outline'
import { useTranslation } from '@/hooks/useTranslation'

const TeacherDashboard: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'submissions' | 'progress'>('overview')

  // Fetch dashboard data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: teacherApi.getDashboard,
  })

  // Grade assignment mutation
  const gradeAssignmentMutation = useMutation({
    mutationFn: ({ submissionId, score, feedback }: { submissionId: string; score: number; feedback?: string }) =>
      teacherApi.gradeAssignment(submissionId, { score, feedback }),
    onSuccess: () => {
      toast.success('Задание оценено!')
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] })
    },
    onError: (error: any) => {
      toast.error('Ошибка при оценке: ' + error.message)
    }
  })

  const handleGradeAssignment = (submissionId: string, score: number, feedback?: string) => {
    gradeAssignmentMutation.mutate({ submissionId, score, feedback })
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

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Нет данных</h2>
          <p className="text-secondary-500">Панель преподавателя пуста</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      name: 'Всего студентов',
      value: dashboard.studentProgress.length,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Ожидают проверки',
      value: dashboard.pendingSubmissions.length,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Завершенные курсы',
      value: dashboard.studentProgress.filter(s => s.completedLessons === s.totalLessons).length,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Средний балл',
      value: dashboard.studentProgress.length > 0 
        ? Math.round(dashboard.studentProgress.reduce((sum, s) => sum + s.averageScore, 0) / dashboard.studentProgress.length)
        : 0,
      icon: StarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Панель преподавателя
          </h1>
          <p className="text-secondary-600">
            Управление курсами, студентами и заданиями
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 mb-8">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Обзор', icon: ChartBarIcon },
                { key: 'submissions', label: 'Задания на проверку', icon: ClockIcon },
                { key: 'progress', label: 'Прогресс студентов', icon: UsersIcon },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedTab(key as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === key
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
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Последние активности
                  </h3>
                  
                  <div className="space-y-4">
                    {dashboard.pendingSubmissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="flex items-center space-x-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-secondary-900">
                            Новое задание от студента
                          </p>
                          <p className="text-xs text-secondary-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button className="btn-outline text-sm">
                          Проверить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Топ студенты
                  </h3>
                  
                  <div className="space-y-3">
                    {dashboard.studentProgress
                      .sort((a, b) => b.averageScore - a.averageScore)
                      .slice(0, 5)
                      .map((student, index) => (
                        <div key={student.userId} className="flex items-center space-x-4 p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-900">
                              {student.userName}
                            </p>
                            <p className="text-xs text-secondary-500">
                              Средний балл: {student.averageScore}%
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 text-yellow-500">
                            <StarIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{student.averageScore}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submissions Tab */}
            {selectedTab === 'submissions' && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Задания на проверку ({dashboard.pendingSubmissions.length})
                </h3>
                
                {dashboard.pendingSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircleIcon className="h-16 w-16 text-green-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-secondary-700 mb-2">
                      Все задания проверены!
                    </h4>
                    <p className="text-secondary-500">
                      Нет заданий, ожидающих проверки
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard.pendingSubmissions.map((submission) => (
                      <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        onGrade={handleGradeAssignment}
                        isGrading={gradeAssignmentMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Progress Tab */}
            {selectedTab === 'progress' && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Прогресс студентов ({dashboard.studentProgress.length})
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Студент
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Прогресс
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Средний балл
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Последняя активность
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {dashboard.studentProgress.map((student) => (
                        <tr key={student.userId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {student.userName.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-secondary-900">
                                  {student.userName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary-900">
                              {student.completedLessons} / {student.totalLessons} уроков
                            </div>
                            <div className="w-full bg-secondary-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ 
                                  width: `${(student.completedLessons / student.totalLessons) * 100}%` 
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium text-secondary-900">
                                {student.averageScore}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            {new Date(student.lastActivity).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Submission Card Component
interface SubmissionCardProps {
  submission: AssignmentSubmission
  onGrade: (submissionId: string, score: number, feedback?: string) => void
  isGrading: boolean
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onGrade, isGrading }) => {
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isGradingMode, setIsGradingMode] = useState(false)

  const handleSubmitGrade = () => {
    if (score < 0 || score > 100) {
      toast.error('Оценка должна быть от 0 до 100')
      return
    }
    onGrade(submission.id, score, feedback)
    setIsGradingMode(false)
  }

  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-medium text-secondary-900 mb-2">
            Задание #{submission.id.slice(-8)}
          </h4>
          <p className="text-sm text-secondary-600 mb-4">
            Отправлено: {new Date(submission.submittedAt).toLocaleString()}
          </p>
          
          <div className="bg-secondary-50 rounded-lg p-4 mb-4">
            <h5 className="text-sm font-medium text-secondary-700 mb-2">Ответ студента:</h5>
            <p className="text-sm text-secondary-900 whitespace-pre-wrap">
              {submission.content}
            </p>
          </div>

          {submission.attachments.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-secondary-700 mb-2">Прикрепленные файлы:</h5>
              <div className="space-y-2">
                {submission.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center space-x-2 text-sm">
                    <DocumentIcon className="h-4 w-4 text-secondary-400" />
                    <span className="text-secondary-900">{attachment.title}</span>
                    <a 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800"
                    >
                      Скачать
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ml-6">
          {isGradingMode ? (
            <div className="w-80 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Оценка (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Комментарий (необязательно)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Обратная связь для студента..."
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setIsGradingMode(false)}
                  className="btn-outline flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSubmitGrade}
                  disabled={isGrading}
                  className="btn-primary flex-1"
                >
                  {isGrading ? 'Оценивание...' : 'Оценить'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsGradingMode(true)}
              className="btn-primary"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Оценить
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
