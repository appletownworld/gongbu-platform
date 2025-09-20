import { Injectable, Logger, NotFoundException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FileValidationService } from './file-validation.service';
import { 
  UploadedFileInfo, 
  FileUploadMetadata, 
  FileStorageConfig, 
  FileUploadContext 
} from './interfaces/file.interface';
import { FileUploadDto, FileUploadResponseDto } from './dto/file-upload.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly storageConfig: FileStorageConfig;

  constructor(
    private configService: ConfigService,
    private validationService: FileValidationService
  ) {
    this.storageConfig = {
      provider: this.configService.get<'local' | 's3' | 'gcs'>('STORAGE_PROVIDER', 'local'),
      maxFileSize: this.configService.get<number>('UPLOAD_MAX_SIZE', 100 * 1024 * 1024),
      uploadPath: this.configService.get<string>('FILE_STORAGE_PATH', '/app/uploads'),
      allowedMimeTypes: [],
      cdnUrl: this.configService.get<string>('CDN_URL')
    };

    // Убеждаемся что папка для загрузок существует
    this.ensureUploadDirectoryExists();
  }

  /**
   * Загрузка файла
   */
  async uploadFile(
    file: Express.Multer.File, 
    uploadDto: FileUploadDto, 
    userId: string
  ): Promise<FileUploadResponseDto> {
    this.logger.log(`Uploading file: ${file.originalname} (${file.size} bytes) for user ${userId}`);

    try {
      // 1. Валидация файла
      await this.validationService.validateFile(file, uploadDto.context);

      // 2. Генерация метаданных
      const metadata: FileUploadMetadata = {
        ...uploadDto,
        userId
      };

      // 3. Генерация уникального имени файла
      const filename = this.generateFileName(file, metadata);

      // 4. Загрузка в зависимости от провайдера
      let fileUrl: string;
      let filePath: string;

      switch (this.storageConfig.provider) {
        case 'local':
          const uploadResult = await this.uploadToLocal(file, filename, uploadDto.context);
          fileUrl = uploadResult.url;
          filePath = uploadResult.path;
          break;
        case 's3':
          fileUrl = await this.uploadToS3(file, filename, metadata);
          break;
        case 'gcs':
          fileUrl = await this.uploadToGCS(file, filename, metadata);
          break;
        default:
          throw new InternalServerErrorException('Неподдерживаемый провайдер хранения');
      }

      // 5. Создание записи в БД
      const uploadedFile: UploadedFileInfo = {
        id: uuidv4(),
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: this.addCDNPrefix(fileUrl),
        path: filePath,
        uploadedAt: new Date(),
        uploadedBy: userId,
        context: uploadDto.context
      };

      // 6. Обработка изображений (создание миниатюр)
      let thumbnailUrl: string | undefined;
      if (this.isImageFile(file.mimetype)) {
        thumbnailUrl = await this.createImageThumbnail(uploadedFile);
      }

      // 7. Сохранение информации о файле (в будущем можно добавить таблицу files)
      await this.saveFileRecord(uploadedFile, metadata);

      // 8. Обновление связанных сущностей
      await this.updateRelatedEntity(uploadedFile, metadata);

      this.logger.log(`File uploaded successfully: ${filename}`);

      return {
        id: uploadedFile.id,
        filename: uploadedFile.filename,
        originalName: uploadedFile.originalName,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
        url: uploadedFile.url,
        uploadedAt: uploadedFile.uploadedAt,
        thumbnailUrl,
        processingStatus: 'completed'
      };

    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Загрузка файла в локальное хранилище
   */
  private async uploadToLocal(
    file: Express.Multer.File, 
    filename: string, 
    context: FileUploadContext
  ): Promise<{ url: string; path: string }> {
    const contextDir = this.getContextDirectory(context);
    const fullDir = path.join(this.storageConfig.uploadPath, contextDir);
    
    // Создаем директорию если не существует
    await fs.promises.mkdir(fullDir, { recursive: true });
    
    const filePath = path.join(fullDir, filename);
    const relativeFilePath = path.join(contextDir, filename);
    
    // Сохраняем файл
    await fs.promises.writeFile(filePath, file.buffer);
    
    // Генерируем URL
    const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3002');
    const fileUrl = `${baseUrl}/files/${relativeFilePath}`;
    
    return {
      url: fileUrl,
      path: filePath
    };
  }

  /**
   * Загрузка в AWS S3 (заготовка для будущей реализации)
   */
  private async uploadToS3(
    file: Express.Multer.File, 
    filename: string, 
    metadata: FileUploadMetadata
  ): Promise<string> {
    // TODO: Реализовать загрузку в S3
    throw new InternalServerErrorException('S3 upload not implemented yet');
  }

  /**
   * Загрузка в Google Cloud Storage (заготовка)
   */
  private async uploadToGCS(
    file: Express.Multer.File, 
    filename: string, 
    metadata: FileUploadMetadata
  ): Promise<string> {
    // TODO: Реализовать загрузку в GCS
    throw new InternalServerErrorException('GCS upload not implemented yet');
  }

  /**
   * Генерация уникального имени файла
   */
  private generateFileName(file: Express.Multer.File, metadata: FileUploadMetadata): string {
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const extension = this.getFileExtension(file.originalname);
    
    let prefix = '';
    if (metadata.courseId) prefix += `course-${metadata.courseId}_`;
    if (metadata.lessonId) prefix += `lesson-${metadata.lessonId}_`;
    if (metadata.assignmentId) prefix += `assignment-${metadata.assignmentId}_`;
    
    return `${prefix}${timestamp}_${randomSuffix}${extension}`;
  }

  /**
   * Получение директории для контекста
   */
  private getContextDirectory(context: FileUploadContext): string {
    const contextDirs: Record<FileUploadContext, string> = {
      'course-cover': 'courses/covers',
      'course-thumbnail': 'courses/thumbnails',
      'lesson-video': 'courses/lessons/videos',
      'lesson-audio': 'courses/lessons/audio',
      'lesson-attachment': 'courses/lessons/attachments',
      'assignment-submission': 'assignments/submissions',
      'user-avatar': 'users/avatars',
      'temp': 'temp'
    };
    
    return contextDirs[context];
  }

  /**
   * Создание миниатюры изображения
   */
  private async createImageThumbnail(fileInfo: UploadedFileInfo): Promise<string | undefined> {
    if (!this.isImageFile(fileInfo.mimeType) || !fileInfo.path) {
      return undefined;
    }

    try {
      const thumbnailDir = path.dirname(fileInfo.path);
      const thumbnailName = `thumb_${path.basename(fileInfo.filename, path.extname(fileInfo.filename))}.webp`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailName);

      // Создаем миниатюру 300x300 
      await sharp(fileInfo.path)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(thumbnailPath);

      // Возвращаем URL миниатюры
      const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3002');
      const relativePath = path.relative(this.storageConfig.uploadPath, thumbnailPath);
      return this.addCDNPrefix(`${baseUrl}/files/${relativePath}`);

    } catch (error) {
      this.logger.error(`Failed to create thumbnail for ${fileInfo.filename}: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Обновление связанных сущностей
   */
  private async updateRelatedEntity(fileInfo: UploadedFileInfo, metadata: FileUploadMetadata): Promise<void> {
    // TODO: Добавить PrismaService и обновление связанных сущностей
    // Например, обновление lessons.video_url, courses.cover_image_url и т.д.
    
    try {
      switch (metadata.context) {
        case 'course-cover':
          if (metadata.courseId) {
            // await this.prisma.course.update({
            //   where: { id: metadata.courseId },
            //   data: { coverImageUrl: fileInfo.url }
            // });
            this.logger.log(`Would update course ${metadata.courseId} cover image`);
          }
          break;
        case 'lesson-video':
          if (metadata.lessonId) {
            // await this.prisma.lesson.update({
            //   where: { id: metadata.lessonId },
            //   data: { videoUrl: fileInfo.url }
            // });
            this.logger.log(`Would update lesson ${metadata.lessonId} video URL`);
          }
          break;
        // Добавить другие случаи...
      }
    } catch (error) {
      this.logger.error(`Failed to update related entity: ${error.message}`);
      // Не прерываем процесс загрузки из-за ошибки обновления связанной сущности
    }
  }

  /**
   * Сохранение записи о файле
   */
  private async saveFileRecord(fileInfo: UploadedFileInfo, metadata: FileUploadMetadata): Promise<void> {
    try {
      await this.prisma.file.create({
        data: {
          id: fileInfo.id,
          filename: fileInfo.filename,
          originalFilename: fileInfo.originalFilename,
          mimeType: fileInfo.mimeType,
          size: fileInfo.size,
          path: fileInfo.path,
          url: fileInfo.url,
          context: metadata.context as any, // Convert string to enum
          isPublic: metadata.isPublic || false,
          userId: metadata.userId,
          courseId: metadata.courseId || null,
          lessonId: metadata.lessonId || null,
          assignmentId: metadata.assignmentId || null,
          status: 'UPLOADED',
          metadata: fileInfo.metadata || {},
        },
      });
      
      this.logger.log(`✅ File metadata saved to database: ${fileInfo.id} - ${fileInfo.filename}`);
    } catch (error) {
      this.logger.error(`❌ Failed to save file metadata to database:`, error);
      // Don't throw error to avoid breaking file upload
    }
  }

  /**
   * Утилиты
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex).toLowerCase();
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private addCDNPrefix(url: string): string {
    if (this.storageConfig.cdnUrl && url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        const cdnObj = new URL(this.storageConfig.cdnUrl);
        urlObj.hostname = cdnObj.hostname;
        return urlObj.toString();
      } catch (error) {
        this.logger.warn(`Failed to add CDN prefix to URL: ${url}`, error.message);
        return url;
      }
    }
    return url;
  }

  private ensureUploadDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.storageConfig.uploadPath)) {
        fs.mkdirSync(this.storageConfig.uploadPath, { recursive: true });
        this.logger.log(`Created upload directory: ${this.storageConfig.uploadPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  /**
   * Удаление файла
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      // Find file record
      const fileRecord = await this.prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!fileRecord) {
        throw new NotFoundException('File not found');
      }

      // Check ownership (only owner can delete)
      if (fileRecord.userId !== userId) {
        throw new UnauthorizedException('You do not have permission to delete this file');
      }

      // Delete physical file
      const fullPath = path.join(this.uploadPath, fileRecord.path);
      try {
        await fs.unlink(fullPath);
        this.logger.log(`✅ Physical file deleted: ${fullPath}`);
      } catch (error) {
        this.logger.warn(`⚠️ Could not delete physical file: ${error.message}`);
      }

      // Delete database record
      await this.prisma.file.delete({
        where: { id: fileId }
      });

      this.logger.log(`✅ File deleted successfully: ${fileId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to delete file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Получение информации о файле
   */
  async getFileInfo(fileId: string): Promise<FileUploadResponseDto> {
    try {
      const fileRecord = await this.prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!fileRecord) {
        throw new NotFoundException('File not found');
      }

      return {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalFilename: fileRecord.originalFilename,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        url: fileRecord.url,
        context: fileRecord.context as any,
        isPublic: fileRecord.isPublic,
        uploadedAt: fileRecord.createdAt,
        metadata: fileRecord.metadata as any || {},
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get file info for ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Получение списка файлов пользователя
   */
  async getUserFiles(
    userId: string, 
    context?: FileUploadContext, 
    page: number = 1,
    limit: number = 20
  ): Promise<FileUploadResponseDto[]> {
    try {
      const skip = (page - 1) * limit;
      
      const files = await this.prisma.file.findMany({
        where: {
          userId,
          ...(context ? { context } : {}),
          deletedAt: null, // Only non-deleted files
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      });

      return files.map(file => ({
        id: file.id,
        filename: file.filename,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
        context: file.context as any,
        isPublic: file.isPublic,
        uploadedAt: file.createdAt,
        metadata: file.metadata as any || {},
      }));
    } catch (error) {
      this.logger.error(`❌ Failed to get user files for ${userId}:`, error);
      throw error;
    }
  }
}
