import apiClient from './api'
import { 
  Quiz, 
  QuizAttempt, 
  Assignment, 
  AssignmentSubmission,
  CreateQuizDto,
  CreateAssignmentDto,
  QuizResponse,
  AssignmentResponse,
  TeacherDashboard
} from '@/types/quiz'

// Quiz API
export const quizApi = {
  // Get quizzes for a course
  getCourseQuizzes: async (courseId: string): Promise<Quiz[]> => {
    const response = await apiClient.get<Quiz[]>(`/api/quizzes/course/${courseId}`)
    return response.data
  },

  // Get quiz by ID
  getQuiz: async (quizId: string): Promise<QuizResponse> => {
    const response = await apiClient.get<QuizResponse>(`/api/quizzes/${quizId}`)
    return response.data
  },

  // Create quiz
  createQuiz: async (data: CreateQuizDto): Promise<Quiz> => {
    const response = await apiClient.post<Quiz>('/api/quizzes', data)
    return response.data
  },

  // Update quiz
  updateQuiz: async (quizId: string, data: Partial<CreateQuizDto>): Promise<Quiz> => {
    const response = await apiClient.put<Quiz>(`/api/quizzes/${quizId}`, data)
    return response.data
  },

  // Delete quiz
  deleteQuiz: async (quizId: string): Promise<void> => {
    await apiClient.delete(`/api/quizzes/${quizId}`)
  },

  // Start quiz attempt
  startQuizAttempt: async (quizId: string): Promise<QuizAttempt> => {
    const response = await apiClient.post<QuizAttempt>(`/api/quizzes/${quizId}/attempts`)
    return response.data
  },

  // Submit quiz attempt
  submitQuizAttempt: async (attemptId: string, answers: any[]): Promise<QuizAttempt> => {
    const response = await apiClient.post<QuizAttempt>(`/api/quiz-attempts/${attemptId}/submit`, { answers })
    return response.data
  },

  // Get user's quiz attempts
  getUserQuizAttempts: async (quizId: string): Promise<QuizAttempt[]> => {
    const response = await apiClient.get<QuizAttempt[]>(`/api/quizzes/${quizId}/attempts`)
    return response.data
  },

  // Get quiz statistics (for teachers)
  getQuizStatistics: async (quizId: string): Promise<any> => {
    const response = await apiClient.get(`/api/quizzes/${quizId}/statistics`)
    return response.data
  },
}

// Assignment API
export const assignmentApi = {
  // Get assignments for a course
  getCourseAssignments: async (courseId: string): Promise<Assignment[]> => {
    const response = await apiClient.get<Assignment[]>(`/api/assignments/course/${courseId}`)
    return response.data
  },

  // Get assignment by ID
  getAssignment: async (assignmentId: string): Promise<AssignmentResponse> => {
    const response = await apiClient.get<AssignmentResponse>(`/api/assignments/${assignmentId}`)
    return response.data
  },

  // Create assignment
  createAssignment: async (data: CreateAssignmentDto): Promise<Assignment> => {
    const response = await apiClient.post<Assignment>('/api/assignments', data)
    return response.data
  },

  // Update assignment
  updateAssignment: async (assignmentId: string, data: Partial<CreateAssignmentDto>): Promise<Assignment> => {
    const response = await apiClient.put<Assignment>(`/api/assignments/${assignmentId}`, data)
    return response.data
  },

  // Delete assignment
  deleteAssignment: async (assignmentId: string): Promise<void> => {
    await apiClient.delete(`/api/assignments/${assignmentId}`)
  },

  // Submit assignment
  submitAssignment: async (assignmentId: string, data: { content: string; attachments?: File[] }): Promise<AssignmentSubmission> => {
    const formData = new FormData()
    formData.append('content', data.content)
    
    if (data.attachments) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file)
      })
    }

    const response = await apiClient.post<AssignmentSubmission>(`/api/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Get user's assignment submissions
  getUserSubmissions: async (assignmentId: string): Promise<AssignmentSubmission[]> => {
    const response = await apiClient.get<AssignmentSubmission[]>(`/api/assignments/${assignmentId}/submissions`)
    return response.data
  },

  // Grade assignment (for teachers)
  gradeAssignment: async (submissionId: string, data: { score: number; feedback?: string }): Promise<AssignmentSubmission> => {
    const response = await apiClient.post<AssignmentSubmission>(`/api/assignment-submissions/${submissionId}/grade`, data)
    return response.data
  },

  // Get assignment statistics (for teachers)
  getAssignmentStatistics: async (assignmentId: string): Promise<any> => {
    const response = await apiClient.get(`/api/assignments/${assignmentId}/statistics`)
    return response.data
  },
}

// Teacher Dashboard API
export const teacherApi = {
  // Get teacher dashboard data
  getDashboard: async (): Promise<TeacherDashboard> => {
    const response = await apiClient.get<TeacherDashboard>('/api/teacher/dashboard')
    return response.data
  },

  // Get pending submissions
  getPendingSubmissions: async (): Promise<AssignmentSubmission[]> => {
    const response = await apiClient.get<AssignmentSubmission[]>('/api/teacher/pending-submissions')
    return response.data
  },

  // Get pending quiz reviews
  getPendingQuizReviews: async (): Promise<QuizAttempt[]> => {
    const response = await apiClient.get<QuizAttempt[]>('/api/teacher/pending-quiz-reviews')
    return response.data
  },

  // Grade assignment (for teachers)
  gradeAssignment: async (submissionId: string, data: { score: number; feedback?: string }): Promise<AssignmentSubmission> => {
    const response = await apiClient.post<AssignmentSubmission>(`/api/assignment-submissions/${submissionId}/grade`, data)
    return response.data
  },

  // Bulk grade assignments
  bulkGradeAssignments: async (gradings: Array<{ submissionId: string; score: number; feedback?: string }>): Promise<void> => {
    await apiClient.post('/api/teacher/bulk-grade-assignments', { gradings })
  },

  // Get student progress for a course
  getStudentProgress: async (courseId: string): Promise<any[]> => {
    const response = await apiClient.get(`/api/teacher/courses/${courseId}/student-progress`)
    return response.data
  },
}

export default { quizApi, assignmentApi, teacherApi }
