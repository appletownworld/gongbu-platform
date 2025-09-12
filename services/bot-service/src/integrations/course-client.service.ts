import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  imageUrl?: string;
  price: number;
  currency: string;
  difficulty: string;
  category: string;
  language: string;
  duration?: number;
  lessonCount: number;
  studentCount: number;
  rating: number;
  reviewCount: number;
  isPublished: boolean;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseList {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  order: number;
  contentType: string;
  isPublished: boolean;
  isFree: boolean;
  videoUrl?: string;
  content?: string;
}

export interface StudentProgress {
  courseId: string;
  userId: string;
  enrolledAt: Date;
  lastAccessedAt?: Date;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DROPPED';
  timeSpent: number;
  certificateIssued: boolean;
}

@Injectable()
export class CourseClientService {
  private readonly logger = new Logger(CourseClientService.name);
  private courseServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.courseServiceUrl = this.configService.get<string>('COURSE_SERVICE_URL') || 'http://course-service:3002';
  }

  private getServiceHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Service-Name': 'bot-service',
    };
  }

  private getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error';
  }

  /**
   * Получить список курсов с фильтрацией
   */
  async getCourses(params: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    language?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    tags?: string[];
  } = {}): Promise<CourseList> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.category) queryParams.set('category', params.category);
      if (params.difficulty) queryParams.set('difficulty', params.difficulty);
      if (params.language) queryParams.set('language', params.language);
      if (params.minPrice) queryParams.set('minPrice', params.minPrice.toString());
      if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice.toString());
      if (params.search) queryParams.set('search', params.search);
      if (params.tags && params.tags.length > 0) {
        queryParams.set('tags', params.tags.join(','));
      }

      const response = await firstValueFrom(
        this.httpService.get<CourseList>(
          `${this.courseServiceUrl}/courses?${queryParams.toString()}`,
          {
            headers: this.getServiceHeaders(),
            timeout: 10000,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch courses:', this.getErrorMessage(error));
      
      // Fallback mock data for development
      return this.getMockCourseList(params);
    }
  }

  /**
   * Получить конкретный курс по ID
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Course>(
          `${this.courseServiceUrl}/courses/${courseId}`,
          {
            headers: this.getServiceHeaders(),
            timeout: 5000,
          }
        )
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      
      this.logger.error(`Failed to fetch course ${courseId}:`, this.getErrorMessage(error));
      return null;
    }
  }

  /**
   * Получить уроки курса
   */
  async getCourseLessons(courseId: string): Promise<Lesson[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Lesson[]>(
          `${this.courseServiceUrl}/courses/${courseId}/lessons`,
          {
            headers: this.getServiceHeaders(),
            timeout: 5000,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch lessons for course ${courseId}:`, this.getErrorMessage(error));
      return [];
    }
  }

  /**
   * Получить прогресс студента по курсу
   */
  async getStudentProgress(userId: string, courseId: string): Promise<StudentProgress | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<StudentProgress>(
          `${this.courseServiceUrl}/progress/${userId}/${courseId}`,
          {
            headers: this.getServiceHeaders(),
            timeout: 5000,
          }
        )
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      
      this.logger.error(`Failed to fetch progress for user ${userId} in course ${courseId}:`, this.getErrorMessage(error));
      return null;
    }
  }

  /**
   * Получить все курсы пользователя
   */
  async getUserCourses(userId: string): Promise<{
    enrolled: Course[];
    completed: Course[];
    inProgress: Course[];
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{
          enrolled: Course[];
          completed: Course[];
          inProgress: Course[];
        }>(
          `${this.courseServiceUrl}/users/${userId}/courses`,
          {
            headers: this.getServiceHeaders(),
            timeout: 10000,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch courses for user ${userId}:`, this.getErrorMessage(error));
      
      return {
        enrolled: [],
        completed: [],
        inProgress: [],
      };
    }
  }

  /**
   * Поиск курсов
   */
  async searchCourses(query: string, limit: number = 10): Promise<Course[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Course[]>(
          `${this.courseServiceUrl}/courses/search?q=${encodeURIComponent(query)}&limit=${limit}`,
          {
            headers: this.getServiceHeaders(),
            timeout: 5000,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to search courses with query "${query}":`, this.getErrorMessage(error));
      return [];
    }
  }

  /**
   * Проверить здоровье Course Service
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.courseServiceUrl}/health`, {
          timeout: 3000,
        })
      );

      return response.status === 200;
    } catch (error) {
      this.logger.warn('Course Service health check failed:', this.getErrorMessage(error));
      return false;
    }
  }

  /**
   * Mock данные для разработки и тестирования
   */
  private getMockCourseList(params: any): CourseList {
    const mockCourses: Course[] = [
      {
        id: 'course-1',
        title: '🐍 Python для начинающих',
        description: 'Полный курс по программированию на Python с нуля до продвинутого уровня',
        shortDescription: 'Изучите Python за 30 дней',
        imageUrl: 'https://via.placeholder.com/300x200?text=Python+Course',
        price: 4999,
        currency: 'RUB',
        difficulty: 'BEGINNER',
        category: 'Программирование',
        language: 'ru',
        duration: 2400, // в минутах
        lessonCount: 24,
        studentCount: 1247,
        rating: 4.8,
        reviewCount: 156,
        isPublished: true,
        tags: ['python', 'programming', 'beginner'],
        author: {
          id: 'author-1',
          name: 'Алексей Петров',
          avatar: 'https://via.placeholder.com/100x100?text=AP'
        },
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-12-01'),
      },
      {
        id: 'course-2',
        title: '⚛️ React + TypeScript',
        description: 'Создание современных веб-приложений с React и TypeScript',
        shortDescription: 'Frontend разработка',
        imageUrl: 'https://via.placeholder.com/300x200?text=React+Course',
        price: 7999,
        currency: 'RUB',
        difficulty: 'INTERMEDIATE',
        category: 'Веб-разработка',
        language: 'ru',
        duration: 3600,
        lessonCount: 32,
        studentCount: 892,
        rating: 4.9,
        reviewCount: 98,
        isPublished: true,
        tags: ['react', 'typescript', 'frontend'],
        author: {
          id: 'author-2',
          name: 'Мария Иванова',
          avatar: 'https://via.placeholder.com/100x100?text=MI'
        },
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date('2023-11-15'),
      },
      {
        id: 'course-3',
        title: '🤖 Machine Learning',
        description: 'Машинное обучение на практике с Python и scikit-learn',
        shortDescription: 'ML с нуля',
        imageUrl: 'https://via.placeholder.com/300x200?text=ML+Course',
        price: 12999,
        currency: 'RUB',
        difficulty: 'ADVANCED',
        category: 'Искусственный интеллект',
        language: 'ru',
        duration: 4800,
        lessonCount: 40,
        studentCount: 456,
        rating: 4.7,
        reviewCount: 67,
        isPublished: true,
        tags: ['ml', 'ai', 'python', 'data-science'],
        author: {
          id: 'author-3',
          name: 'Дмитрий Козлов',
          avatar: 'https://via.placeholder.com/100x100?text=DK'
        },
        createdAt: new Date('2023-05-10'),
        updatedAt: new Date('2023-12-20'),
      }
    ];

    const filteredCourses = mockCourses.filter(course => {
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        return (
          course.title.toLowerCase().includes(searchLower) ||
          course.description.toLowerCase().includes(searchLower) ||
          course.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });

    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

    return {
      courses: paginatedCourses,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredCourses.length / limit),
        totalItems: filteredCourses.length,
        hasNext: endIndex < filteredCourses.length,
        hasPrev: page > 1,
      },
    };
  }
}
