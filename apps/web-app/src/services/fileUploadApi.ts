import axios from 'axios';
import { UploadResult, FileUploadContext } from '../components/FileUpload';

const API_BASE_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:3002/api/v1';

interface FileUploadRequest {
  file: File;
  context: FileUploadContext;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  customFilename?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class FileUploadService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Универсальная загрузка файла
   */
  async uploadFile(
    request: FileUploadRequest,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadResult> {
    const formData = new FormData();
    
    // Добавляем файл
    formData.append('file', request.file);
    
    // Добавляем метаданные
    formData.append('context', request.context);
    if (request.courseId) formData.append('courseId', request.courseId);
    if (request.lessonId) formData.append('lessonId', request.lessonId);
    if (request.assignmentId) formData.append('assignmentId', request.assignmentId);
    if (request.customFilename) formData.append('customFilename', request.customFilename);
    if (request.isPublic !== undefined) formData.append('isPublic', String(request.isPublic));
    if (request.metadata) formData.append('metadata', JSON.stringify(request.metadata));

    try {
      const response = await axios.post<UploadResult>(
        `${this.baseURL}/files/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress: FileUploadProgress = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
              };
              onProgress(progress);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Загрузка обложки курса
   */
  async uploadCourseCover(
    courseId: string, 
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('cover', file);

    try {
      const response = await axios.post<UploadResult>(
        `${this.baseURL}/files/upload/course/${courseId}/cover`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress: FileUploadProgress = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
              };
              onProgress(progress);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Course cover upload failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Загрузка видео урока
   */
  async uploadLessonVideo(
    lessonId: string, 
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post<UploadResult>(
        `${this.baseURL}/files/upload/lesson/${lessonId}/video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress: FileUploadProgress = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
              };
              onProgress(progress);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Lesson video upload failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Загрузка аудио урока
   */
  async uploadLessonAudio(
    lessonId: string, 
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post<UploadResult>(
        `${this.baseURL}/files/upload/lesson/${lessonId}/audio`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress: FileUploadProgress = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
              };
              onProgress(progress);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Lesson audio upload failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Загрузка вложения урока
   */
  async uploadLessonAttachment(
    lessonId: string, 
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('attachment', file);

    try {
      const response = await axios.post<UploadResult>(
        `${this.baseURL}/files/upload/lesson/${lessonId}/attachment`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress: FileUploadProgress = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
              };
              onProgress(progress);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Lesson attachment upload failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получить информацию о файле
   */
  async getFileInfo(fileId: string): Promise<UploadResult> {
    try {
      const response = await axios.get<UploadResult>(
        `${this.baseURL}/files/${fileId}`
      );
      return response.data;
    } catch (error) {
      console.error('Get file info failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получить файлы пользователя
   */
  async getUserFiles(
    userId: string,
    context?: FileUploadContext,
    page: number = 1,
    limit: number = 20
  ): Promise<UploadResult[]> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      
      if (context) {
        params.append('context', context);
      }

      const response = await axios.get<UploadResult[]>(
        `${this.baseURL}/files/user/${userId}?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Get user files failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Удалить файл
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/files/${fileId}`);
    } catch (error) {
      console.error('Delete file failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Получить лимиты загрузки
   */
  async getUploadLimits(): Promise<Record<string, { maxSize: number; allowedTypes: string[] }>> {
    try {
      const response = await axios.get<{ limits: Record<string, { maxSize: number; allowedTypes: string[] }> }>(
        `${this.baseURL}/files/validation/limits`
      );
      return response.data.limits;
    } catch (error) {
      console.error('Get upload limits failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Обработка ошибок
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      const status = error.response?.status;
      
      switch (status) {
        case 400:
          return new Error(`Некорректные данные: ${message}`);
        case 413:
          return new Error('Файл слишком большой');
        case 415:
          return new Error('Неподдерживаемый тип файла');
        case 401:
          return new Error('Необходима авторизация');
        case 403:
          return new Error('Недостаточно прав для загрузки файла');
        case 500:
          return new Error('Ошибка сервера при загрузке файла');
        default:
          return new Error(`Ошибка загрузки: ${message}`);
      }
    }
    
    return new Error('Неизвестная ошибка загрузки файла');
  }
}

// Экспорт единственного экземпляра сервиса
export const fileUploadService = new FileUploadService();
export default fileUploadService;
export type { FileUploadRequest, FileUploadProgress };
