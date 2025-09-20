import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { 
  Assignment,
  AssignmentSubmission,
  AssignmentType,
  SubmissionStatus,
  File
} from '@prisma/client';
import { EnvironmentVariables } from '../config/env.validation';
import { AssignmentUtils } from './assignment-types';

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  instructions: string;
  type: AssignmentType;
  content: Record<string, any>;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  maxScore?: number;
  passingScore?: number;
  timeLimit?: number; // в минутах
  dueDate?: Date;
  order?: number;
  settings?: Record<string, any>;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  instructions?: string;
  content?: Record<string, any>;
  maxScore?: number;
  passingScore?: number;
  timeLimit?: number;
  dueDate?: Date;
  order?: number;
  settings?: Record<string, any>;
  isPublished?: boolean;
}

export interface AssignmentQuery {
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  type?: AssignmentType;
  isPublished?: boolean;
  search?: string;
  sortBy?: 'order' | 'createdAt' | 'title' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AssignmentWithDetails extends Assignment {
  submissions?: AssignmentSubmission[];
  files?: File[];
  _count?: {
    submissions: number;
  };
  stats?: {
    submissionsCount: number;
    averageScore: number;
    completionRate: number;
    onTimeSubmissions: number;
  };
}

export interface GradingRubric {
  id: string;
  name: string;
  description?: string;
  criteria: GradingCriteria[];
  totalPoints: number;
}

export interface GradingCriteria {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: GradingLevel[];
}

export interface GradingLevel {
  id: string;
  name: string;
  description: string;
  points: number;
}

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Создать новое задание
   */
  async createAssignment(request: CreateAssignmentRequest, creatorId: string): Promise<Assignment> {
    this.logger.log(`Создание задания: ${request.title}`, {
      type: request.type,
      courseId: request.courseId,
      creatorId,
    });

    try {
      // Проверяем права на создание задания в курсе
      await this.validateCourseAccess(request.courseId, creatorId);

      // Валидируем контент задания в зависимости от типа
      const contentValidation = AssignmentUtils.validateAssignmentContent(request.type, request.content);
      if (!contentValidation.isValid) {
        throw new BadRequestException(`Неверный контент задания: ${contentValidation.errors.join(', ')}`);
      }

      // Определяем порядок задания
      const order = request.order || await this.getNextOrder(request.courseId);

      // Создаем задание
      const assignment = await this.prisma.assignment.create({
        data: {
          title: request.title,
          description: request.description,
          instructions: request.instructions,
          type: request.type,
          content: request.content,
          courseId: request.courseId,
          moduleId: request.moduleId,
          lessonId: request.lessonId,
          maxScore: request.maxScore || 100,
          passingScore: request.passingScore || 60,
          timeLimit: request.timeLimit,
          dueDate: request.dueDate,
          order,
          settings: request.settings || {},
          isPublished: false, // По умолчанию неопубликованное
        },
      });

      // Отправляем событие
      this.eventEmitter.emit('assignment.created', {
        assignment,
        creatorId,
      });

      this.logger.log(`✅ Задание создано: ${assignment.id} - ${assignment.title}`);

      return assignment;
    } catch (error) {
      this.logger.error('❌ Ошибка создания задания:', error);
      throw error;
    }
  }

  /**
   * Получить задание по ID
   */
  async getAssignment(
    assignmentId: string, 
    includeSubmissions = false,
    includeStats = false
  ): Promise<AssignmentWithDetails | null> {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: { id: true, title: true, slug: true }
        },
        module: {
          select: { id: true, title: true, order: true }
        },
        lesson: {
          select: { id: true, title: true, order: true }
        },
        files: true,
        submissions: includeSubmissions ? {
          include: {
            enrollment: {
              select: { studentId: true }
            }
          }
        } : undefined,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!assignment) {
      return null;
    }

    // Добавляем статистику если требуется
    let stats = undefined;
    if (includeStats) {
      stats = await this.calculateAssignmentStats(assignmentId);
    }

    return {
      ...assignment,
      stats,
    } as AssignmentWithDetails;
  }

  /**
   * Обновить задание
   */
  async updateAssignment(
    assignmentId: string,
    request: UpdateAssignmentRequest,
    updaterId: string
  ): Promise<Assignment> {
    this.logger.log(`Обновление задания: ${assignmentId}`, { updaterId });

    try {
      // Проверяем существование задания и права
      const existingAssignment = await this.getAssignment(assignmentId);
      if (!existingAssignment) {
        throw new NotFoundException('Задание не найдено');
      }

      await this.validateCourseAccess(existingAssignment.courseId, updaterId);

      // Обновляем задание
      const assignment = await this.prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          ...(request.title && { title: request.title }),
          ...(request.description && { description: request.description }),
          ...(request.instructions && { instructions: request.instructions }),
          ...(request.content && { content: request.content }),
          ...(request.maxScore && { maxScore: request.maxScore }),
          ...(request.passingScore && { passingScore: request.passingScore }),
          ...(request.timeLimit !== undefined && { timeLimit: request.timeLimit }),
          ...(request.dueDate !== undefined && { dueDate: request.dueDate }),
          ...(request.order && { order: request.order }),
          ...(request.settings && { settings: request.settings }),
          ...(request.isPublished !== undefined && { isPublished: request.isPublished }),
          updatedAt: new Date(),
        },
      });

      // Отправляем событие
      this.eventEmitter.emit('assignment.updated', {
        assignment,
        updaterId,
      });

      this.logger.log(`✅ Задание обновлено: ${assignment.id}`);

      return assignment;
    } catch (error) {
      this.logger.error('❌ Ошибка обновления задания:', error);
      throw error;
    }
  }

  /**
   * Удалить задание
   */
  async deleteAssignment(assignmentId: string, deleterId: string): Promise<void> {
    this.logger.log(`Удаление задания: ${assignmentId}`, { deleterId });

    try {
      // Проверяем существование и права
      const assignment = await this.getAssignment(assignmentId);
      if (!assignment) {
        throw new NotFoundException('Задание не найдено');
      }

      await this.validateCourseAccess(assignment.courseId, deleterId);

      // Мягкое удаление
      await this.prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          deletedAt: new Date(),
        },
      });

      // Отправляем событие
      this.eventEmitter.emit('assignment.deleted', {
        assignmentId,
        courseId: assignment.courseId,
        deleterId,
      });

      this.logger.log(`✅ Задание удалено: ${assignmentId}`);
    } catch (error) {
      this.logger.error('❌ Ошибка удаления задания:', error);
      throw error;
    }
  }

  /**
   * Получить список заданий с фильтрацией
   */
  async getAssignments(query: AssignmentQuery): Promise<{
    assignments: AssignmentWithDetails[];
    total: number;
  }> {
    this.logger.debug('Получение списка заданий', query);

    const where: any = {
      deletedAt: null, // Только не удаленные
    };

    // Фильтры
    if (query.courseId) where.courseId = query.courseId;
    if (query.moduleId) where.moduleId = query.moduleId;
    if (query.lessonId) where.lessonId = query.lessonId;
    if (query.type) where.type = query.type;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished;

    // Текстовый поиск
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { instructions: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Сортировка
    const orderBy: any = {};
    switch (query.sortBy) {
      case 'order':
        orderBy.order = query.sortOrder || 'asc';
        break;
      case 'createdAt':
        orderBy.createdAt = query.sortOrder || 'desc';
        break;
      case 'title':
        orderBy.title = query.sortOrder || 'asc';
        break;
      case 'dueDate':
        orderBy.dueDate = query.sortOrder || 'asc';
        break;
      default:
        orderBy.order = 'asc';
        break;
    }

    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        orderBy,
        take: query.limit || 50,
        skip: query.offset || 0,
        include: {
          course: {
            select: { id: true, title: true, slug: true }
          },
          module: {
            select: { id: true, title: true, order: true }
          },
          lesson: {
            select: { id: true, title: true, order: true }
          },
          files: true,
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return {
      assignments: assignments as AssignmentWithDetails[],
      total,
    };
  }

  /**
   * Опубликовать задание
   */
  async publishAssignment(assignmentId: string, publisherId: string): Promise<Assignment> {
    this.logger.log(`Публикация задания: ${assignmentId}`, { publisherId });

    const assignment = await this.updateAssignment(
      assignmentId, 
      { isPublished: true }, 
      publisherId
    );

    // Отправляем уведомления студентам
    this.eventEmitter.emit('assignment.published', {
      assignment,
      publisherId,
    });

    return assignment;
  }

  /**
   * Снять с публикации
   */
  async unpublishAssignment(assignmentId: string, publisherId: string): Promise<Assignment> {
    this.logger.log(`Снятие с публикации задания: ${assignmentId}`, { publisherId });

    return this.updateAssignment(
      assignmentId, 
      { isPublished: false }, 
      publisherId
    );
  }

  /**
   * Дублировать задание
   */
  async duplicateAssignment(
    assignmentId: string, 
    duplicatorId: string,
    newTitle?: string
  ): Promise<Assignment> {
    this.logger.log(`Дублирование задания: ${assignmentId}`, { duplicatorId });

    try {
      // Получаем оригинальное задание
      const originalAssignment = await this.getAssignment(assignmentId);
      if (!originalAssignment) {
        throw new NotFoundException('Задание для дублирования не найдено');
      }

      await this.validateCourseAccess(originalAssignment.courseId, duplicatorId);

      // Создаем копию
      const duplicateRequest: CreateAssignmentRequest = {
        title: newTitle || `${originalAssignment.title} (копия)`,
        description: originalAssignment.description,
        instructions: originalAssignment.instructions,
        type: originalAssignment.type,
        content: originalAssignment.content as Record<string, any>,
        courseId: originalAssignment.courseId,
        moduleId: originalAssignment.moduleId,
        lessonId: originalAssignment.lessonId,
        maxScore: originalAssignment.maxScore,
        passingScore: originalAssignment.passingScore,
        timeLimit: originalAssignment.timeLimit,
        dueDate: originalAssignment.dueDate,
        settings: originalAssignment.settings as Record<string, any>,
      };

      const duplicatedAssignment = await this.createAssignment(duplicateRequest, duplicatorId);

      this.logger.log(`✅ Задание продублировано: ${duplicatedAssignment.id}`);

      return duplicatedAssignment;
    } catch (error) {
      this.logger.error('❌ Ошибка дублирования задания:', error);
      throw error;
    }
  }

  /**
   * Создать шаблон задания по типу
   */
  async createAssignmentTemplate(type: AssignmentType, language?: string): Promise<any> {
    this.logger.log(`Создание шаблона задания типа: ${type}`);

    try {
      let template;
      
      switch (type) {
        case 'QUIZ':
          template = AssignmentUtils.createAssignmentTemplate('QUIZ');
          break;
        case 'CODE':
          template = AssignmentUtils.createAssignmentTemplate('CODE');
          if (language && ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust'].includes(language)) {
            // Можно настроить шаблон под конкретный язык
            template.language = language;
          }
          break;
        default:
          template = {
            description: `Шаблон для задания типа ${type}`,
            instructions: 'Добавьте инструкции для выполнения задания',
            settings: AssignmentUtils.getDefaultSettings(type),
          };
      }

      return template;
    } catch (error) {
      this.logger.error('❌ Ошибка создания шаблона задания:', error);
      throw new BadRequestException(`Не удалось создать шаблон для типа ${type}: ${error.message}`);
    }
  }

  /**
   * Подготовить задание для студента (убрать ответы, перемешать вопросы и т.д.)
   */
  prepareAssignmentForStudent(assignment: Assignment): any {
    try {
      return AssignmentUtils.prepareAssignmentForStudent(assignment.type, assignment.content);
    } catch (error) {
      this.logger.warn(`Не удалось подготовить задание для студента: ${error.message}`);
      return assignment.content; // Возвращаем как есть в случае ошибки
    }
  }

  /**
   * Проверить, поддерживает ли тип задания автоматическую проверку
   */
  supportsAutoGrading(assignmentType: AssignmentType): boolean {
    return AssignmentUtils.supportsAutoGrading(assignmentType);
  }

  /**
   * Получить статистику задания
   */
  async getAssignmentAnalytics(assignmentId: string): Promise<{
    totalSubmissions: number;
    uniqueSubmissions: number;
    averageScore: number;
    completionRate: number;
    onTimeSubmissions: number;
    lateSubmissions: number;
    gradingProgress: number;
    scoreDistribution: { range: string; count: number }[];
    submissionTrend: { date: string; count: number }[];
  }> {
    this.logger.debug(`Получение аналитики задания: ${assignmentId}`);

    const assignment = await this.getAssignment(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    // Базовые метрики
    const [
      totalSubmissions,
      uniqueSubmissions,
      averageScoreResult,
      onTimeSubmissions,
      gradedSubmissions,
      enrollmentCount
    ] = await Promise.all([
      // Общее количество подач
      this.prisma.assignmentSubmission.count({
        where: { assignmentId },
      }),

      // Уникальные студенты, подавшие работы
      this.prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        distinct: ['studentId'],
        select: { studentId: true },
      }).then(result => result.length),

      // Средний балл
      this.prisma.assignmentSubmission.aggregate({
        where: { 
          assignmentId,
          status: SubmissionStatus.GRADED,
          score: { not: null },
        },
        _avg: { score: true },
      }),

      // Количество сданных вовремя
      this.prisma.assignmentSubmission.count({
        where: {
          assignmentId,
          ...(assignment.dueDate && {
            submittedAt: { lte: assignment.dueDate }
          }),
        },
      }),

      // Количество проверенных работ
      this.prisma.assignmentSubmission.count({
        where: {
          assignmentId,
          status: SubmissionStatus.GRADED,
        },
      }),

      // Количество записанных на курс студентов
      this.prisma.enrollment.count({
        where: {
          courseId: assignment.courseId,
          status: 'ACTIVE',
        },
      }),
    ]);

    // Расчет производных метрик
    const averageScore = Number(averageScoreResult._avg.score) || 0;
    const completionRate = enrollmentCount > 0 ? (uniqueSubmissions / enrollmentCount) * 100 : 0;
    const lateSubmissions = totalSubmissions - onTimeSubmissions;
    const gradingProgress = totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 100 : 0;

    // Распределение оценок
    const scoreDistribution = await this.calculateScoreDistribution(assignmentId);

    // Тренд подач
    const submissionTrend = await this.calculateSubmissionTrend(assignmentId);

    return {
      totalSubmissions,
      uniqueSubmissions,
      averageScore,
      completionRate,
      onTimeSubmissions,
      lateSubmissions,
      gradingProgress,
      scoreDistribution,
      submissionTrend,
    };
  }

  // Приватные методы

  private async validateCourseAccess(courseId: string, userId: string): Promise<void> {
    // Проверяем, что пользователь имеет права на курс
    // В реальном приложении здесь бы была проверка через Auth Service
    // Пока что просто проверяем существование курса
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    // TODO: Добавить проверку прав через Auth Service
    // if (course.creatorId !== userId && !course.collaboratorIds.includes(userId)) {
    //   throw new UnauthorizedException('Нет прав на управление этим курсом');
    // }
  }

  private async getNextOrder(courseId: string): Promise<number> {
    const lastAssignment = await this.prisma.assignment.findFirst({
      where: { courseId, deletedAt: null },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return (lastAssignment?.order || 0) + 1;
  }

  private async calculateAssignmentStats(assignmentId: string) {
    const [
      submissionsCount,
      averageScoreResult,
      completionResult,
      onTimeCount
    ] = await Promise.all([
      this.prisma.assignmentSubmission.count({
        where: { assignmentId },
      }),

      this.prisma.assignmentSubmission.aggregate({
        where: { 
          assignmentId,
          status: SubmissionStatus.GRADED,
          score: { not: null },
        },
        _avg: { score: true },
      }),

      this.prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        distinct: ['studentId'],
        select: { studentId: true },
      }),

      this.prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { dueDate: true },
      }).then(async (assignment) => {
        if (!assignment?.dueDate) return 0;
        
        return this.prisma.assignmentSubmission.count({
          where: {
            assignmentId,
            submittedAt: { lte: assignment.dueDate },
          },
        });
      }),
    ]);

    const averageScore = Number(averageScoreResult._avg.score) || 0;
    const completionRate = completionResult.length; // Уникальные студенты
    const onTimeSubmissions = onTimeCount;

    return {
      submissionsCount,
      averageScore,
      completionRate,
      onTimeSubmissions,
    };
  }

  private async calculateScoreDistribution(assignmentId: string) {
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        assignmentId,
        status: SubmissionStatus.GRADED,
        score: { not: null },
      },
      select: { score: true },
    });

    const ranges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    const distribution = ranges.map(range => ({ range, count: 0 }));

    submissions.forEach(sub => {
      const score = Number(sub.score);
      if (score <= 20) distribution[0].count++;
      else if (score <= 40) distribution[1].count++;
      else if (score <= 60) distribution[2].count++;
      else if (score <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    return distribution;
  }

  private async calculateSubmissionTrend(assignmentId: string) {
    // Получаем подачи за последние 7 дней
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        assignmentId,
        submittedAt: { gte: sevenDaysAgo },
      },
      select: { submittedAt: true },
      orderBy: { submittedAt: 'asc' },
    });

    // Группируем по дням
    const dailyCounts = new Map<string, number>();
    
    submissions.forEach(sub => {
      const date = sub.submittedAt.toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    // Формируем массив за последние 7 дней
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      trend.push({
        date: dateStr,
        count: dailyCounts.get(dateStr) || 0,
      });
    }

    return trend;
  }
}
