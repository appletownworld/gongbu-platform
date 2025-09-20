import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { FileValidationService } from './file-validation.service';
import { 
  FileUploadDto, 
  FileUploadResponseDto, 
  FileListResponseDto 
} from './dto/file-upload.dto';
import { FileUploadContext } from './interfaces/file.interface';
import { JwtAuthGuard, UserContext } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Files')
@Controller('files')
@ApiBearerAuth()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly validationService: FileValidationService
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a file' })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    type: FileUploadResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or parameters' })
  @ApiResponse({ status: 413, description: 'File too large' })
  @ApiResponse({ status: 415, description: 'Unsupported file type' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload'
        },
        context: {
          type: 'string',
          enum: ['course-cover', 'course-thumbnail', 'lesson-video', 'lesson-audio', 'lesson-attachment', 'assignment-submission', 'user-avatar', 'temp']
        },
        courseId: {
          type: 'string',
          format: 'uuid',
          description: 'Course ID (if applicable)'
        },
        lessonId: {
          type: 'string', 
          format: 'uuid',
          description: 'Lesson ID (if applicable)'
        },
        assignmentId: {
          type: 'string',
          format: 'uuid', 
          description: 'Assignment ID (if applicable)'
        },
        customFilename: {
          type: 'string',
          description: 'Custom filename (optional)'
        },
        isPublic: {
          type: 'boolean',
          description: 'Whether file should be publicly accessible'
        }
      },
      required: ['file', 'context']
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: FileUploadDto,
    @GetUser() user: UserContext
  ): Promise<FileUploadResponseDto> {
    return this.filesService.uploadFile(file, uploadDto, user.userId);
  }

  @Post('upload/course/:courseId/cover')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload course cover image' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('cover'))
  @UseGuards(JwtAuthGuard)
  async uploadCourseCover(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ })
        ]
      })
    ) file: Express.Multer.File,
    @GetUser() user: UserContext
  ): Promise<FileUploadResponseDto> {
    const uploadDto: FileUploadDto = {
      context: 'course-cover',
      courseId,
      isPublic: true
    };

    return this.filesService.uploadFile(file, uploadDto, user.userId);
  }

  @Post('upload/lesson/:lessonId/video')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload lesson video' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('video'))
  @UseGuards(JwtAuthGuard)
  async uploadLessonVideo(
    @Param('lessonId') lessonId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 }), // 500MB
          new FileTypeValidator({ fileType: /^video\/(mp4|webm|avi|mov|quicktime|x-msvideo)$/ })
        ]
      })
    ) file: Express.Multer.File,
    @GetUser() user: UserContext
  ): Promise<FileUploadResponseDto> {
    const uploadDto: FileUploadDto = {
      context: 'lesson-video',
      lessonId,
      isPublic: false
    };

    return this.filesService.uploadFile(file, uploadDto, user.userId);
  }

  @Post('upload/lesson/:lessonId/audio')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload lesson audio' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('audio'))
  @UseGuards(JwtAuthGuard)
  async uploadLessonAudio(
    @Param('lessonId') lessonId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
          new FileTypeValidator({ fileType: /^audio\/(mpeg|mp3|wav|wave|x-wav|aac|m4a|x-m4a)$/ })
        ]
      })
    ) file: Express.Multer.File,
    @GetUser() user: UserContext
  ): Promise<FileUploadResponseDto> {
    const uploadDto: FileUploadDto = {
      context: 'lesson-audio',
      lessonId,
      isPublic: false
    };

    return this.filesService.uploadFile(file, uploadDto, user.userId);
  }

  @Post('upload/lesson/:lessonId/attachment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload lesson attachment' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('attachment'))
  @UseGuards(JwtAuthGuard)
  async uploadLessonAttachment(
    @Param('lessonId') lessonId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }) // 50MB
        ]
      })
    ) file: Express.Multer.File,
    @GetUser() user: UserContext
  ): Promise<FileUploadResponseDto> {
    const uploadDto: FileUploadDto = {
      context: 'lesson-attachment',
      lessonId,
      isPublic: false
    };

    return this.filesService.uploadFile(file, uploadDto, user.userId);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get file information' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'File information retrieved',
    type: FileUploadResponseDto
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileInfo(@Param('fileId') fileId: string): Promise<FileUploadResponseDto> {
    return this.filesService.getFileInfo(fileId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user files' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'context', required: false, enum: ['course-cover', 'course-thumbnail', 'lesson-video', 'lesson-audio', 'lesson-attachment', 'assignment-submission', 'user-avatar', 'temp'] })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User files retrieved',
    type: [FileUploadResponseDto]
  })
  async getUserFiles(
    @Param('userId') userId: string,
    @Query('context') context?: FileUploadContext,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ): Promise<FileUploadResponseDto[]> {
    return this.filesService.getUserFiles(userId, context, page, limit);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this file' })
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Param('fileId') fileId: string,
    @GetUser() user: UserContext
  ): Promise<void> {
    return this.filesService.deleteFile(fileId, user.userId);
  }

  @Get('validation/limits')
  @ApiOperation({ summary: 'Get file upload limits for different contexts' })
  @ApiResponse({ 
    status: 200, 
    description: 'Upload limits retrieved',
    schema: {
      type: 'object',
      properties: {
        limits: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              maxSize: { type: 'number', description: 'Maximum file size in bytes' },
              allowedTypes: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  })
  async getUploadLimits() {
    const contexts: FileUploadContext[] = [
      'course-cover', 'course-thumbnail', 'lesson-video', 
      'lesson-audio', 'lesson-attachment', 'assignment-submission', 
      'user-avatar', 'temp'
    ];

    const limits: Record<string, { maxSize: number; allowedTypes: string[] }> = {};

    contexts.forEach(context => {
      limits[context] = {
        maxSize: this.validationService.getMaxFileSize(context),
        allowedTypes: this.validationService.getAllowedMimeTypes(context)
      };
    });

    return { limits };
  }
}
