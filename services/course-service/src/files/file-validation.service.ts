import { Injectable, BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mimeTypes from 'mime-types';
import { FileUploadContext } from './interfaces/file.interface';

@Injectable()
export class FileValidationService {
  private readonly maxFileSizes: Record<FileUploadContext, number>;
  private readonly allowedMimeTypes: Record<FileUploadContext, string[]>;

  constructor(private configService: ConfigService) {
    // Максимальные размеры файлов (в байтах)
    this.maxFileSizes = {
      'course-cover': 5 * 1024 * 1024,        // 5 MB
      'course-thumbnail': 2 * 1024 * 1024,    // 2 MB
      'lesson-video': 500 * 1024 * 1024,      // 500 MB
      'lesson-audio': 100 * 1024 * 1024,      // 100 MB
      'lesson-attachment': 50 * 1024 * 1024,  // 50 MB
      'assignment-submission': 20 * 1024 * 1024, // 20 MB
      'user-avatar': 3 * 1024 * 1024,         // 3 MB
      'temp': 10 * 1024 * 1024,               // 10 MB
    };

    // Разрешенные MIME типы
    this.allowedMimeTypes = {
      'course-cover': [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
      ],
      'course-thumbnail': [
        'image/jpeg',
        'image/jpg',
        'image/png', 
        'image/webp'
      ],
      'lesson-video': [
        'video/mp4',
        'video/webm',
        'video/avi',
        'video/mov',
        'video/quicktime',
        'video/x-msvideo'
      ],
      'lesson-audio': [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/aac',
        'audio/m4a',
        'audio/x-m4a'
      ],
      'lesson-attachment': [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ],
      'assignment-submission': [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/zip',
        'application/x-zip-compressed'
      ],
      'user-avatar': [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ],
      'temp': [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf'
      ]
    };
  }

  /**
   * Валидация загружаемого файла
   */
  async validateFile(file: Express.Multer.File, context: FileUploadContext): Promise<void> {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    // 1. Проверка размера файла
    this.validateFileSize(file, context);

    // 2. Проверка MIME типа
    this.validateMimeType(file, context);

    // 3. Проверка расширения файла
    this.validateFileExtension(file, context);

    // 4. Проверка имени файла
    this.validateFilename(file);

    // 5. Проверка безопасности (magic bytes)
    await this.validateFileContent(file);
  }

  /**
   * Проверка размера файла
   */
  private validateFileSize(file: Express.Multer.File, context: FileUploadContext): void {
    const maxSize = this.maxFileSizes[context];
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      throw new PayloadTooLargeException(
        `Файл слишком большой. Максимальный размер: ${maxSizeMB} МБ, размер файла: ${fileSizeMB} МБ`
      );
    }
  }

  /**
   * Проверка MIME типа
   */
  private validateMimeType(file: Express.Multer.File, context: FileUploadContext): void {
    const allowedTypes = this.allowedMimeTypes[context];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Недопустимый тип файла: ${file.mimetype}. Разрешенные типы: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Проверка расширения файла
   */
  private validateFileExtension(file: Express.Multer.File, context: FileUploadContext): void {
    const extension = this.getFileExtension(file.originalname);
    const expectedMimeType = mimeTypes.lookup(extension);
    
    if (!expectedMimeType || expectedMimeType !== file.mimetype) {
      throw new BadRequestException(
        `Несоответствие расширения файла и MIME типа: ${extension} -> ${file.mimetype}`
      );
    }

    // Запрещенные расширения
    const blockedExtensions = [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', 
      '.js', '.jar', '.app', '.deb', '.dmg', '.iso', '.msi'
    ];
    
    if (blockedExtensions.includes(extension.toLowerCase())) {
      throw new BadRequestException(`Запрещенное расширение файла: ${extension}`);
    }
  }

  /**
   * Проверка имени файла
   */
  private validateFilename(file: Express.Multer.File): void {
    // Проверка на опасные символы
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.originalname)) {
      throw new BadRequestException('Имя файла содержит недопустимые символы');
    }

    // Проверка длины имени
    if (file.originalname.length > 255) {
      throw new BadRequestException('Имя файла слишком длинное (максимум 255 символов)');
    }

    // Проверка на пустое имя
    if (!file.originalname.trim()) {
      throw new BadRequestException('Имя файла не может быть пустым');
    }
  }

  /**
   * Проверка содержимого файла (magic bytes)
   */
  private async validateFileContent(file: Express.Multer.File): Promise<void> {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Файл пуст или поврежден');
    }

    // Получаем первые байты файла для проверки
    const fileSignature = file.buffer.slice(0, 8);
    
    // Проверяем соответствие magic bytes заявленному MIME типу
    const isValidSignature = this.validateMagicBytes(fileSignature, file.mimetype);
    if (!isValidSignature) {
      throw new BadRequestException(
        'Содержимое файла не соответствует заявленному типу'
      );
    }
  }

  /**
   * Проверка magic bytes файла
   */
  private validateMagicBytes(signature: Buffer, mimeType: string): boolean {
    // Основные magic bytes для проверки
    const magicBytes: Record<string, Buffer[]> = {
      'image/jpeg': [
        Buffer.from([0xFF, 0xD8, 0xFF]) // JPEG
      ],
      'image/png': [
        Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) // PNG
      ],
      'image/webp': [
        Buffer.from([0x52, 0x49, 0x46, 0x46]) // RIFF (WebP начинается с RIFF)
      ],
      'application/pdf': [
        Buffer.from([0x25, 0x50, 0x44, 0x46]) // %PDF
      ],
      'video/mp4': [
        Buffer.from([0x00, 0x00, 0x00]), // MP4 может начинаться по-разному
        Buffer.from([0x66, 0x74, 0x79, 0x70]) // ftyp
      ],
      'application/zip': [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP
        Buffer.from([0x50, 0x4B, 0x05, 0x06])  // Empty ZIP
      ]
    };

    const expectedSignatures = magicBytes[mimeType];
    if (!expectedSignatures) {
      // Если нет проверки для этого типа, пропускаем
      return true;
    }

    // Проверяем, соответствует ли сигнатура одной из ожидаемых
    return expectedSignatures.some(expectedSig => 
      signature.subarray(0, expectedSig.length).equals(expectedSig)
    );
  }

  /**
   * Получение расширения файла
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return '';
    }
    return filename.substring(lastDotIndex).toLowerCase();
  }

  /**
   * Получение максимального размера для контекста
   */
  getMaxFileSize(context: FileUploadContext): number {
    return this.maxFileSizes[context];
  }

  /**
   * Получение разрешенных MIME типов для контекста
   */
  getAllowedMimeTypes(context: FileUploadContext): string[] {
    return this.allowedMimeTypes[context];
  }
}
