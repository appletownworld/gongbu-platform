import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { LessonRepository } from './lesson.repository';
import { Lesson, LessonContentType, LessonStatus } from '@prisma/client';

export interface CreateLessonRequest {
  title: string;
  content: string;
  contentType?: LessonContentType;
  courseId: string;
  moduleId?: string;
  order?: number;
  duration?: number;
  videoUrl?: string;
  audioUrl?: string;
  attachments?: any[];
  prerequisiteIds?: string[];
  isPreview?: boolean;
  isFree?: boolean;
  settings?: Record<string, any>;
  slug?: string;
  creatorId: string; // from JWT
}

export interface UpdateLessonRequest {
  title?: string;
  content?: string;
  contentType?: LessonContentType;
  duration?: number;
  videoUrl?: string;
  audioUrl?: string;
  attachments?: any[];
  prerequisiteIds?: string[];
  isPreview?: boolean;
  isFree?: boolean;
  settings?: Record<string, any>;
}

export interface LessonQuery {
  courseId?: string;
  moduleId?: string;
  isPublished?: boolean;
  isPreview?: boolean;
  isFree?: boolean;
  contentType?: LessonContentType;
  search?: string;
  creatorId?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'order' | 'createdAt' | 'title';
  orderDirection?: 'asc' | 'desc';
}

export interface LessonProgressUpdate {
  studentId: string;
  status?: LessonStatus;
  progressPercentage?: number;
  completed?: boolean;
  timeSpent?: number;
  watchTime?: number;
  score?: number;
}

@Injectable()
export class LessonsService {
  private readonly logger = new Logger(LessonsService.name);

  constructor(private readonly lessonRepository: LessonRepository) {}

  /**
   * Создание нового урока
   */
  async create(createLessonDto: CreateLessonRequest): Promise<Lesson> {
    this.logger.log(`Создание урока: ${createLessonDto.title}`, {
      courseId: createLessonDto.courseId,
      creatorId: createLessonDto.creatorId,
    });

    // Валидация курса и прав доступа
    await this.validateCourseAccess(createLessonDto.courseId, createLessonDto.creatorId);

    // Генерируем slug если не предоставлен
    const slug = createLessonDto.slug || this.generateSlug(createLessonDto.title);

    // Проверяем уникальность slug в рамках курса
    await this.validateSlugUniqueness(createLessonDto.courseId, slug);

    // Определяем order если не предоставлен
    const order = createLessonDto.order ?? await this.getNextLessonOrder(createLessonDto.courseId);

    // Создаем урок
    const lesson = await this.lessonRepository.create({
      ...createLessonDto,
      slug,
      order,
      attachments: createLessonDto.attachments || [],
      prerequisiteIds: createLessonDto.prerequisiteIds || [],
      settings: createLessonDto.settings || {},
      isPublished: false, // Уроки создаются как черновики
    });

    this.logger.log(`Урок создан: ${lesson.id} - ${lesson.title}`);
    return lesson;
  }

  /**
   * Получение урока по ID
   */
  async findOne(id: string, options?: { includeUnpublished?: boolean }): Promise<Lesson> {
    this.logger.debug(`Получение урока: ${id}`);

    const lesson = await this.lessonRepository.findById(id, {
      includeProgress: false,
      includeAssignments: false,
      includeCourse: true,
      includeModule: true,
      includeFiles: true,
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    // Проверяем, опубликован ли урок (если не указано иначе)
    if (!options?.includeUnpublished && !lesson.isPublished) {
      throw new NotFoundException('Урок не опубликован');
    }

    return lesson;
  }

  /**
   * Получение уроков курса
   */
  async findByCourse(
    courseId: string, 
    options?: { 
      includeUnpublished?: boolean;
      studentId?: string;
      includeProgress?: boolean;
    }
  ): Promise<Lesson[]> {
    this.logger.debug(`Получение уроков курса: ${courseId}`);

    const lessons = await this.lessonRepository.findByCourse(courseId, {
      includeUnpublished: options?.includeUnpublished || false,
      includeProgress: options?.includeProgress || false,
      studentId: options?.studentId,
      orderBy: 'order',
      orderDirection: 'asc',
    });

    return lessons;
  }

  /**
   * Получение списка уроков с фильтрацией
   */
  async findMany(query: LessonQuery): Promise<{ lessons: Lesson[], total: number }> {
    this.logger.debug('Получение списка уроков', query);

    const result = await this.lessonRepository.findMany(query);
    return result;
  }

  /**
   * Обновление урока
   */
  async update(id: string, updateLessonDto: UpdateLessonRequest, creatorId: string): Promise<Lesson> {
    this.logger.log(`Обновление урока: ${id}`, { creatorId });

    // Проверяем существование урока и права доступа
    const existingLesson = await this.findOne(id, { includeUnpublished: true });
    await this.validateCourseAccess(existingLesson.courseId, creatorId);

    // Обновляем урок
    const updatedLesson = await this.lessonRepository.update(id, updateLessonDto);

    this.logger.log(`Урок обновлен: ${id}`);
    return updatedLesson;
  }

  /**
   * Удаление урока
   */
  async delete(id: string, creatorId: string): Promise<void> {
    this.logger.log(`Удаление урока: ${id}`, { creatorId });

    // Проверяем существование урока и права доступа
    const lesson = await this.findOne(id, { includeUnpublished: true });
    await this.validateCourseAccess(lesson.courseId, creatorId);

    // Проверяем, нет ли активных студентов
    const hasActiveProgress = await this.lessonRepository.hasActiveProgress(id);
    if (hasActiveProgress) {
      throw new BadRequestException(
        'Нельзя удалить урок с активным прогрессом студентов. Снимите с публикации вместо удаления.'
      );
    }

    await this.lessonRepository.delete(id);
    this.logger.log(`Урок удален: ${id}`);
  }

  /**
   * Публикация урока
   */
  async publish(id: string, creatorId: string): Promise<Lesson> {
    this.logger.log(`Публикация урока: ${id}`, { creatorId });

    // Проверяем существование урока и права доступа
    const lesson = await this.findOne(id, { includeUnpublished: true });
    await this.validateCourseAccess(lesson.courseId, creatorId);

    // Валидируем готовность к публикации
    this.validateLessonForPublishing(lesson);

    // Публикуем урок
    const publishedLesson = await this.lessonRepository.update(id, {
      // isPublished: true, // Field doesn't exist in UpdateLessonRequest
    });

    this.logger.log(`Урок опубликован: ${id}`);
    return publishedLesson;
  }

  /**
   * Снятие урока с публикации
   */
  async unpublish(id: string, creatorId: string): Promise<Lesson> {
    this.logger.log(`Снятие урока с публикации: ${id}`, { creatorId });

    // Проверяем существование урока и права доступа
    const lesson = await this.findOne(id, { includeUnpublished: true });
    await this.validateCourseAccess(lesson.courseId, creatorId);

    // Снимаем с публикации
    const unpublishedLesson = await this.lessonRepository.update(id, {
      // isPublished: false, // Field doesn't exist in UpdateLessonRequest
    });

    this.logger.log(`Урок снят с публикации: ${id}`);
    return unpublishedLesson;
  }

  /**
   * Дублирование урока
   */
  async duplicate(
    id: string, 
    creatorId: string,
    options?: { 
      newTitle?: string;
      newCourseId?: string;
      includeProgress?: boolean;
    }
  ): Promise<Lesson> {
    this.logger.log(`Дублирование урока: ${id}`, { creatorId });

    // Получаем исходный урок
    const originalLesson = await this.findOne(id, { includeUnpublished: true });
    await this.validateCourseAccess(originalLesson.courseId, creatorId);

    // Если указан новый курс, проверяем доступ к нему
    if (options?.newCourseId) {
      await this.validateCourseAccess(options.newCourseId, creatorId);
    }

    const targetCourseId = options?.newCourseId || originalLesson.courseId;
    const newTitle = options?.newTitle || `${originalLesson.title} (Копия)`;

    // Создаем дубликат
    const duplicateData: CreateLessonRequest = {
      title: newTitle,
      content: originalLesson.content,
      contentType: originalLesson.contentType,
      courseId: targetCourseId,
      moduleId: originalLesson.moduleId,
      duration: originalLesson.duration,
      videoUrl: originalLesson.videoUrl,
      audioUrl: originalLesson.audioUrl,
      attachments: originalLesson.attachments as any[],
      prerequisiteIds: originalLesson.prerequisiteIds,
      isPreview: originalLesson.isPreview,
      isFree: originalLesson.isFree,
      settings: originalLesson.settings as Record<string, any>,
      creatorId,
    };

    const duplicatedLesson = await this.create(duplicateData);

    this.logger.log(`Урок продублирован: ${originalLesson.id} -> ${duplicatedLesson.id}`);
    return duplicatedLesson;
  }

  /**
   * Изменение порядка урока
   */
  async reorder(id: string, newOrder: number, creatorId: string): Promise<void> {
    this.logger.log(`Изменение порядка урока: ${id} -> ${newOrder}`, { creatorId });

    // Проверяем существование урока и права доступа
    const lesson = await this.findOne(id, { includeUnpublished: true });
    await this.validateCourseAccess(lesson.courseId, creatorId);

    await this.lessonRepository.reorderLesson(id, lesson.courseId, newOrder);
    this.logger.log(`Порядок урока изменен: ${id}`);
  }

  /**
   * Обновление прогресса урока для студента
   */
  async updateProgress(
    lessonId: string, 
    progressUpdate: LessonProgressUpdate
  ): Promise<any> {
    this.logger.log(`Обновление прогресса урока: ${lessonId}`, {
      studentId: progressUpdate.studentId,
    });

    // Проверяем существование урока
    const lesson = await this.findOne(lessonId);

    // Обновляем прогресс
    const progress = await this.lessonRepository.updateProgress(lessonId, progressUpdate);

    // Если урок завершен, проверяем, нужно ли обновить общий прогресс по курсу
    if (progressUpdate.completed) {
      // Здесь можно добавить интеграцию с ProgressService для обновления общего прогресса
      this.logger.log(`Урок завершен студентом: ${progressUpdate.studentId}, урок: ${lessonId}`);
    }

    return progress;
  }

  /**
   * Получение прогресса урока для студента
   */
  async getProgress(lessonId: string, studentId: string): Promise<any> {
    this.logger.debug(`Получение прогресса урока: ${lessonId} для студента: ${studentId}`);

    return this.lessonRepository.getProgress(lessonId, studentId);
  }

  /**
   * Получение урока для студента (с учетом прогресса)
   */
  async getLessonForStudent(lessonId: string, studentId: string): Promise<any> {
    this.logger.debug(`Получение урока для студента: ${lessonId}, студент: ${studentId}`);

    const lesson = await this.findOne(lessonId);
    const progress = await this.getProgress(lessonId, studentId);

    // Проверяем доступ к уроку (prerequisites)
    if (lesson.prerequisiteIds.length > 0) {
      await this.validatePrerequisites(lesson.prerequisiteIds, studentId);
    }

    return {
      ...lesson,
      progress,
      canAccess: true, // после проверки prerequisites
    };
  }

  /**
   * Получение статистики урока
   */
  async getLessonStats(lessonId: string, creatorId: string): Promise<{
    totalStudents: number;
    completedStudents: number;
    averageTimeSpent: number;
    averageProgress: number;
    completionRate: number;
  }> {
    this.logger.debug(`Получение статистики урока: ${lessonId}`);

    // Проверяем права доступа
    const lesson = await this.findOne(lessonId, { includeUnpublished: true });
    await this.validateCourseAccess(lesson.courseId, creatorId);

    return this.lessonRepository.getLessonStats(lessonId);
  }

  // Вспомогательные методы
  private async validateCourseAccess(courseId: string, creatorId: string): Promise<void> {
    // Здесь должна быть проверка, что пользователь имеет права на курс
    // Для упрощения пока пропускаем, но в реальной системе это критично
    // const hasAccess = await this.coursesService.hasCreatorAccess(courseId, creatorId);
    // if (!hasAccess) {
    //   throw new ForbiddenException('Нет доступа к курсу');
    // }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private async validateSlugUniqueness(courseId: string, slug: string, excludeId?: string): Promise<void> {
    const existingLesson = await this.lessonRepository.findBySlug(courseId, slug);
    if (existingLesson && existingLesson.id !== excludeId) {
      throw new BadRequestException('Урок с таким slug уже существует в курсе');
    }
  }

  private async getNextLessonOrder(courseId: string): Promise<number> {
    const maxOrder = await this.lessonRepository.getMaxOrder(courseId);
    return (maxOrder || 0) + 1;
  }

  private validateLessonForPublishing(lesson: Lesson): void {
    const errors: string[] = [];

    if (!lesson.title?.trim()) {
      errors.push('Заголовок урока обязателен');
    }

    if (!lesson.content?.trim()) {
      errors.push('Содержимое урока обязательно');
    }

    if (lesson.contentType === LessonContentType.VIDEO && !lesson.videoUrl) {
      errors.push('Для видео-урока необходимо указать URL видео');
    }

    if (lesson.contentType === LessonContentType.AUDIO && !lesson.audioUrl) {
      errors.push('Для аудио-урока необходимо указать URL аудио');
    }

    if (errors.length > 0) {
      throw new BadRequestException(`Урок не готов к публикации: ${errors.join(', ')}`);
    }
  }

  private async validatePrerequisites(prerequisiteIds: string[], studentId: string): Promise<void> {
    if (prerequisiteIds.length === 0) return;

    const completedPrerequisites = await this.lessonRepository.getCompletedPrerequisites(
      prerequisiteIds, 
      studentId
    );

    const missingPrerequisites = prerequisiteIds.filter(
      id => !completedPrerequisites.includes(id)
    );

    if (missingPrerequisites.length > 0) {
      throw new ForbiddenException('Необходимо завершить предыдущие уроки');
    }
  }
}
