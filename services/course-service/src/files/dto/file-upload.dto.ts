import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { FileUploadContext } from '../interfaces/file.interface';

export class FileUploadDto {
  @ApiProperty({ 
    description: 'Context for file upload',
    enum: ['course-cover', 'course-thumbnail', 'lesson-video', 'lesson-audio', 'lesson-attachment', 'assignment-submission', 'user-avatar', 'temp']
  })
  @IsEnum(['course-cover', 'course-thumbnail', 'lesson-video', 'lesson-audio', 'lesson-attachment', 'assignment-submission', 'user-avatar', 'temp'])
  context: FileUploadContext;

  @ApiPropertyOptional({ description: 'Course ID if applicable' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Lesson ID if applicable' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({ description: 'Assignment ID if applicable' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({ description: 'Custom filename (optional)' })
  @IsOptional()
  @IsString()
  customFilename?: string;

  @ApiPropertyOptional({ description: 'Whether file should be publicly accessible' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class FileUploadResponseDto {
  @ApiProperty({ description: 'File ID' })
  id: string;

  @ApiProperty({ description: 'Generated filename' })
  filename: string;

  @ApiProperty({ description: 'Original filename' })
  originalName: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'Public URL to access file' })
  url: string;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: Date;

  @ApiPropertyOptional({ description: 'Thumbnail URL for images/videos' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Video duration in seconds' })
  duration?: number;

  @ApiPropertyOptional({ description: 'Processing status for media files' })
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export class FileListResponseDto {
  @ApiProperty({ description: 'List of files', type: [FileUploadResponseDto] })
  files: FileUploadResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}
