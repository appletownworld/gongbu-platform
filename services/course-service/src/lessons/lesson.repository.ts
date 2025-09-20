import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, Lesson, LessonStatus } from '@prisma/client';
import { CreateLessonRequest, UpdateLessonRequest, LessonQuery, LessonProgressUpdate } from './lessons.service';

export interface LessonFindOptions {
  includeProgress?: boolean;
  includeAssignments?: boolean;
  includeCourse?: boolean;
  includeModule?: boolean;
  includeFiles?: boolean;
  studentId?: string;
}

export interface LessonFindByCourseOptions {
  includeUnpublished?: boolean;
  includeProgress?: boolean;
  studentId?: string;
  orderBy?: 'order' | 'createdAt' | 'title';
  orderDirection?: 'asc' | 'desc';
}

@Injectable()
export class LessonRepository {
  private readonly logger = new Logger(LessonRepository.name);

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Создание урока
   */
  async create(data: CreateLessonRequest & { 
    slug: string; 
    order: number; 
    attachments: any[]; 
    prerequisiteIds: string[]; 
    settings: Record<string, any>; 
    isPublished: boolean;
  }): Promise<Lesson> {
    return this.prisma.lesson.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        contentType: data.contentType || 'TEXT',
        courseId: data.courseId,
        moduleId: data.moduleId,
        order: data.order,
        duration: data.duration,
        videoUrl: data.videoUrl,
        audioUrl: data.audioUrl,
        attachments: data.attachments,
        prerequisiteIds: data.prerequisiteIds,
        isPreview: data.isPreview || false,
        isPublished: data.isPublished,
        isFree: data.isFree || false,
        settings: data.settings,
      },
      include: {
        course: true,
        module: true,
        // files: true, // Field doesn't exist in Prisma model
      },
    });
  }

  /**
   * Получение урока по ID
   */
  async findById(id: string, options: LessonFindOptions = {}): Promise<Lesson | null> {
    const include: any = {};

    if (options.includeCourse) include.course = true;
    if (options.includeModule) include.module = true;
    if (options.includeFiles) include.files = true;
    if (options.includeAssignments) include.assignments = true;
    
    if (options.includeProgress && options.studentId) {
      include.progress = {
        where: { studentId: options.studentId },
      };
    }

    return this.prisma.lesson.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Получение урока по slug в курсе
   */
  async findBySlug(courseId: string, slug: string): Promise<Lesson | null> {
    return this.prisma.lesson.findUnique({
      where: {
        courseId_slug: {
          courseId,
          slug,
        },
      },
    });
  }

  /**
   * Получение уроков курса
   */
  async findByCourse(courseId: string, options: LessonFindByCourseOptions = {}): Promise<Lesson[]> {
    const where: any = { courseId };
    
    if (!options.includeUnpublished) {
      where.isPublished = true;
    }

    const include: any = {
      course: true,
      module: true,
      files: true,
    };

    if (options.includeProgress && options.studentId) {
      include.progress = {
        where: { studentId: options.studentId },
      };
    }

    const orderBy: any = {};
    orderBy[options.orderBy || 'order'] = options.orderDirection || 'asc';

    return this.prisma.lesson.findMany({
      where,
      include,
      orderBy,
    });
  }

  /**
   * Поиск уроков с фильтрацией
   */
  async findMany(query: LessonQuery): Promise<{ lessons: Lesson[], total: number }> {
    const where: any = {};

    if (query.courseId) where.courseId = query.courseId;
    if (query.moduleId) where.moduleId = query.moduleId;
    if (query.contentType) where.contentType = query.contentType;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished;
    if (query.isPreview !== undefined) where.isPreview = query.isPreview;
    if (query.isFree !== undefined) where.isFree = query.isFree;
    if (query.creatorId) {
      where.course = { creatorId: query.creatorId };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    orderBy[query.orderBy || 'order'] = query.orderDirection || 'asc';

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        include: {
          course: true,
          module: true,
          // files: true, // Field doesn't exist in Prisma model
          _count: {
            select: {
              progress: true,
              assignments: true,
            },
          },
        },
        orderBy,
        skip: query.offset || 0,
        take: query.limit || 50,
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return { lessons, total };
  }

  /**
   * Обновление урока
   */
  async update(id: string, data: UpdateLessonRequest): Promise<Lesson> {
    return this.prisma.lesson.update({
      where: { id },
      data,
      include: {
        course: true,
        module: true,
        // files: true, // Field doesn't exist in Prisma model
      },
    });
  }

  /**
   * Удаление урока
   */
  async delete(id: string): Promise<void> {
    await this.prisma.lesson.delete({
      where: { id },
    });
  }

  /**
   * Проверка наличия активного прогресса
   */
  async hasActiveProgress(lessonId: string): Promise<boolean> {
    const count = await this.prisma.lessonProgress.count({
      where: {
        lessonId,
        OR: [
          { status: LessonStatus.IN_PROGRESS },
          { completed: true },
        ],
      },
    });

    return count > 0;
  }

  /**
   * Получение максимального порядка в курсе
   */
  async getMaxOrder(courseId: string): Promise<number> {
    const result = await this.prisma.lesson.aggregate({
      where: { courseId },
      _max: { order: true },
    });

    return result._max.order || 0;
  }

  /**
   * Изменение порядка урока
   */
  async reorderLesson(lessonId: string, courseId: string, newOrder: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Получаем текущий порядок урока
      const currentLesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        select: { order: true },
      });

      if (!currentLesson) throw new Error('Урок не найден');

      const currentOrder = currentLesson.order;

      if (newOrder > currentOrder) {
        // Сдвигаем уроки вниз
        await tx.lesson.updateMany({
          where: {
            courseId,
            order: {
              gt: currentOrder,
              lte: newOrder,
            },
          },
          data: {
            order: { decrement: 1 },
          },
        });
      } else if (newOrder < currentOrder) {
        // Сдвигаем уроки вверх
        await tx.lesson.updateMany({
          where: {
            courseId,
            order: {
              gte: newOrder,
              lt: currentOrder,
            },
          },
          data: {
            order: { increment: 1 },
          },
        });
      }

      // Обновляем порядок текущего урока
      await tx.lesson.update({
        where: { id: lessonId },
        data: { order: newOrder },
      });
    });
  }

  /**
   * Обновление прогресса урока
   */
  async updateProgress(lessonId: string, progressUpdate: LessonProgressUpdate): Promise<any> {
    const { studentId, ...updateData } = progressUpdate;

    // Получаем или создаем enrollment для связи с прогрессом
    let enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        course: {
          lessons: {
            some: { id: lessonId },
          },
        },
      },
    });

    if (!enrollment) {
      // Это не должно происходить в нормальном flow, но добавляем для безопасности
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { courseId: true },
      });

      if (!lesson) throw new Error('Урок не найден');

      // Создаем автоматическую запись на курс
      enrollment = await this.prisma.enrollment.create({
        data: {
          studentId,
          courseId: lesson.courseId,
          status: 'ACTIVE',
        },
      });
    }

    // Обновляем или создаем прогресс урока
    const progressData = {
      ...updateData,
      lastAccessedAt: new Date(),
    };

    if (updateData.completed) {
      // completedAt field doesn't exist in Prisma model
      // progressData.completedAt = new Date();
    }

    if (updateData.status === LessonStatus.IN_PROGRESS) {
      // startedAt field doesn't exist in Prisma model
      // progressData.startedAt = new Date();
    }

    return this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          studentId,
          lessonId,
        },
      },
      update: progressData,
      create: {
        studentId,
        lessonId,
        enrollmentId: enrollment.id,
        status: updateData.status || LessonStatus.IN_PROGRESS,
        progressPercentage: updateData.progressPercentage || 0,
        completed: updateData.completed || false,
        timeSpent: updateData.timeSpent || 0,
        watchTime: updateData.watchTime || 0,
        score: updateData.score,
        startedAt: updateData.status === LessonStatus.IN_PROGRESS ? new Date() : undefined,
        completedAt: updateData.completed ? new Date() : undefined,
        lastAccessedAt: new Date(),
      },
      include: {
        lesson: true,
        enrollment: true,
      },
    });
  }

  /**
   * Получение прогресса урока для студента
   */
  async getProgress(lessonId: string, studentId: string): Promise<any> {
    return this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          studentId,
          lessonId,
        },
      },
      include: {
        lesson: true,
      },
    });
  }

  /**
   * Получение завершенных prerequisite уроков
   */
  async getCompletedPrerequisites(prerequisiteIds: string[], studentId: string): Promise<string[]> {
    const completedLessons = await this.prisma.lessonProgress.findMany({
      where: {
        studentId,
        lessonId: { in: prerequisiteIds },
        completed: true,
      },
      select: { lessonId: true },
    });

    return completedLessons.map(lp => lp.lessonId);
  }

  /**
   * Получение статистики урока
   */
  async getLessonStats(lessonId: string): Promise<{
    totalStudents: number;
    completedStudents: number;
    averageTimeSpent: number;
    averageProgress: number;
    completionRate: number;
  }> {
    const [totalStats, completedStats, timeStats] = await Promise.all([
      this.prisma.lessonProgress.count({
        where: { lessonId },
      }),
      this.prisma.lessonProgress.count({
        where: { lessonId, completed: true },
      }),
      this.prisma.lessonProgress.aggregate({
        where: { lessonId },
        _avg: {
          timeSpent: true,
          progressPercentage: true,
        },
      }),
    ]);

    const totalStudents = totalStats;
    const completedStudents = completedStats;
    const averageTimeSpent = timeStats._avg.timeSpent || 0;
    const averageProgress = Number(timeStats._avg.progressPercentage || 0);
    const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;

    return {
      totalStudents,
      completedStudents,
      averageTimeSpent,
      averageProgress,
      completionRate,
    };
  }

  /**
   * Получение всех уроков пользователя с прогрессом
   */
  async getLessonsWithProgress(studentId: string, courseIds?: string[]): Promise<any[]> {
    const where: any = {
      progress: {
        some: { studentId },
      },
    };

    if (courseIds && courseIds.length > 0) {
      where.courseId = { in: courseIds };
    }

    return this.prisma.lesson.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
        progress: {
          where: { studentId },
        },
      },
      orderBy: [
        { course: { title: 'asc' } },
        { order: 'asc' },
      ],
    });
  }

  /**
   * Массовое обновление статуса публикации для курса
   */
  async bulkUpdatePublishStatus(courseId: string, isPublished: boolean): Promise<number> {
    const result = await this.prisma.lesson.updateMany({
      where: { courseId },
      data: { isPublished },
    });

    return result.count;
  }

  /**
   * Получение количества уроков в курсе по статусам
   */
  async getCourseStatistics(courseId: string): Promise<{
    total: number;
    published: number;
    draft: number;
    preview: number;
    free: number;
  }> {
    const [total, published, draft, preview, free] = await Promise.all([
      this.prisma.lesson.count({ where: { courseId } }),
      this.prisma.lesson.count({ where: { courseId, isPublished: true } }),
      this.prisma.lesson.count({ where: { courseId, isPublished: false } }),
      this.prisma.lesson.count({ where: { courseId, isPreview: true } }),
      this.prisma.lesson.count({ where: { courseId, isFree: true } }),
    ]);

    return { total, published, draft, preview, free };
  }
}
