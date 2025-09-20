export interface UploadedFileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path?: string; // Локальный путь для local storage
  uploadedAt: Date;
  uploadedBy: string;
  context: FileUploadContext;
}

export interface FileUploadMetadata {
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  userId: string;
  context: FileUploadContext;
  isPublic?: boolean;
}

export type FileUploadContext = 
  | 'course-cover'
  | 'course-thumbnail' 
  | 'lesson-video'
  | 'lesson-audio'
  | 'lesson-attachment'
  | 'assignment-submission'
  | 'user-avatar'
  | 'temp';

export interface FileStorageConfig {
  provider: 'local' | 's3' | 'gcs';
  maxFileSize: number;
  uploadPath: string;
  allowedMimeTypes: string[];
  cdnUrl?: string;
}

export interface ProcessedVideoInfo {
  originalUrl: string;
  formats: {
    mp4_1080p?: string;
    mp4_720p?: string;
    mp4_480p?: string;
    webm_1080p?: string;
    webm_720p?: string;
  };
  thumbnailUrl?: string;
  duration?: number;
}
