import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileValidationService } from './file-validation.service';
import * as multer from 'multer';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: multer.memoryStorage(), // Используем память для обработки файлов
        limits: {
          fileSize: configService.get<number>('UPLOAD_MAX_SIZE', 100 * 1024 * 1024), // 100MB
          files: 1, // Максимум 1 файл за раз
          fields: 10, // Максимум 10 полей в форме
          fieldSize: 1024 * 1024, // 1MB для текстовых полей
        },
        fileFilter: (req, file, callback) => {
          // Базовая фильтрация - детальная валидация в сервисе
          const allowedMimes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            // Videos  
            'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo',
            // Audio
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/aac', 'audio/m4a', 'audio/x-m4a',
            // Documents
            'application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
            'text/plain', 'text/csv'
          ];

          if (allowedMimes.includes(file.mimetype)) {
            callback(null, true);
          } else {
            callback(new Error(`Unsupported file type: ${file.mimetype}`), false);
          }
        }
      }),
      inject: [ConfigService]
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, FileValidationService],
  exports: [FilesService, FileValidationService]
})
export class FilesModule {}
