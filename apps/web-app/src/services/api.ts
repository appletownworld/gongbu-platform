import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenResponse, 
  User, 
  UserSession,
  UserStats 
} from '@/types/auth'
import { 
  Course, 
  CourseFilters, 
  CoursesResponse, 
  CourseStats, 
  StudentProgress,
  LessonProgress,
  UserCourses 
} from '@/types/course'

// Base API configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        })

        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', data)
    return response.data
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>('/api/auth/refresh', {
      refreshToken,
    })
    return response.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/api/auth/logout', { refreshToken })
  },

  logoutAll: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout-all')
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/auth/me')
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/api/auth/me', data)
    return response.data
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/api/auth/me')
  },

  getActiveSessions: async (): Promise<UserSession[]> => {
    const response = await apiClient.get<UserSession[]>('/api/auth/sessions')
    return response.data
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/api/auth/sessions/${sessionId}`)
  },

  // Admin endpoints
  getUsers: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/auth/users', { params })
    return response.data
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<UserStats>('/api/auth/users/stats')
    return response.data
  },
}

// Courses API
export const coursesApi = {
  getCourses: async (filters: CourseFilters = {}): Promise<CoursesResponse> => {
    const response = await apiClient.get<CoursesResponse>('/api/courses', {
      params: filters,
    })
    return response.data
  },

  getCourseById: async (id: string): Promise<Course> => {
    const response = await apiClient.get<Course>(`/api/courses/${id}`)
    return response.data
  },

  getCourseBySlug: async (slug: string): Promise<Course> => {
    const response = await apiClient.get<Course>(`/api/courses/slug/${slug}`)
    return response.data
  },

  searchCourses: async (query: string, limit: number = 10): Promise<Course[]> => {
    const response = await apiClient.get<Course[]>('/api/courses/search', {
      params: { q: query, limit },
    })
    return response.data
  },

  createCourse: async (data: any): Promise<Course> => {
    const response = await apiClient.post<Course>('/api/courses', data)
    return response.data
  },

  updateCourse: async (id: string, data: any): Promise<Course> => {
    const response = await apiClient.put<Course>(`/api/courses/${id}`, data)
    return response.data
  },

  deleteCourse: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/courses/${id}`)
  },

  publishCourse: async (id: string): Promise<Course> => {
    const response = await apiClient.post<Course>(`/api/courses/${id}/publish`)
    return response.data
  },

  unpublishCourse: async (id: string): Promise<Course> => {
    const response = await apiClient.post<Course>(`/api/courses/${id}/unpublish`)
    return response.data
  },

  getStats: async (): Promise<CourseStats> => {
    const response = await apiClient.get<CourseStats>('/api/courses/stats')
    return response.data
  },

  getUserCourses: async (userId: string): Promise<UserCourses> => {
    const response = await apiClient.get<UserCourses>(`/api/courses/users/${userId}`)
    return response.data
  },

  // Lessons management
  getLessons: async (courseId: string): Promise<any[]> => {
    const response = await apiClient.get(`/api/lessons/course/${courseId}`)
    return response.data
  },

  createLesson: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/lessons', data)
    return response.data
  },

  updateLesson: async (id: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/api/lessons/${id}`, data)
    return response.data
  },

  deleteLesson: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/lessons/${id}`)
  },

  getCourseBySlug: async (slug: string): Promise<Course> => {
    const response = await apiClient.get<Course>(`/api/courses/slug/${slug}`)
    return response.data
  },
}

// Progress API
export const progressApi = {
  enrollInCourse: async (data: {
    userId: string
    courseId: string
    enrollmentType: 'FREE' | 'PAID'
    paymentId?: string
  }): Promise<any> => {
    const response = await apiClient.post('/api/progress/enroll', data)
    return response.data
  },

  updateLessonProgress: async (
    userId: string, 
    courseId: string, 
    data: {
      lessonId: string
      timeSpent: number
      completed: boolean
      score?: number
    }
  ): Promise<StudentProgress> => {
    const response = await apiClient.put<StudentProgress>(
      `/api/progress/${userId}/${courseId}/lesson`, 
      data
    )
    return response.data
  },

  getStudentProgress: async (userId: string, courseId: string): Promise<StudentProgress | null> => {
    try {
      const response = await apiClient.get<StudentProgress>(`/api/progress/${userId}/${courseId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  getLessonProgress: async (userId: string, courseId: string): Promise<LessonProgress[]> => {
    const response = await apiClient.get<LessonProgress[]>(`/api/progress/${userId}/${courseId}/lessons`)
    return response.data
  },

  getUserCourses: async (userId: string): Promise<UserCourses> => {
    const response = await apiClient.get<UserCourses>(`/api/progress/users/${userId}/courses`)
    return response.data
  },

  issueCertificate: async (userId: string, courseId: string): Promise<any> => {
    const response = await apiClient.post(`/api/progress/${userId}/${courseId}/certificate`)
    return response.data
  },

  unenrollFromCourse: async (userId: string, courseId: string): Promise<void> => {
    await apiClient.delete(`/api/progress/${userId}/${courseId}`)
  },
}

export default apiClient
