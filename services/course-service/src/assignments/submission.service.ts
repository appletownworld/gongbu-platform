import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentSubmission, SubmissionStatus, AssignmentType } from '@prisma/client';
import { AssignmentUtils } from './assignment-types';

export interface CreateSubmissionRequest {
  assignmentId: string;
  enrollmentId: string; // Добавляем обязательное поле
  studentId: string;
  content: any;
  attachments?: string[];
  timeSpent?: number;
  metadata?: Record<string, any>;
}

export interface UpdateSubmissionRequest {
  content?: any;
  attachments?: string[];
  timeSpent?: number;
  metadata?: Record<string, any>;
  status?: SubmissionStatus;
}

export interface GradeSubmissionRequest {
  score: number;
  feedback?: string;
  rubricScores?: Record<string, number>;
  gradedBy: string;
}

export interface SubmissionQuery {
  assignmentId?: string;
  studentId?: string;
  status?: SubmissionStatus;
  gradedBy?: string;
  minScore?: number;
  maxScore?: number;
  submittedFrom?: Date;
  submittedTo?: Date;
  gradedFrom?: Date;
  gradedTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создание новой сдачи задания
   */
  async createSubmission(data: CreateSubmissionRequest): Promise<AssignmentSubmission> {
    this.logger.log(`Создание сдачи для задания: ${data.assignmentId}`, {
      studentId: data.studentId,
    });

    // Проверяем, что задание существует и опубликовано
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: data.assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    if (!assignment.isPublished) {
      throw new ForbiddenException('Задание не опубликовано');
    }

    // Проверяем дедлайн
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      throw new ForbiddenException('Срок сдачи задания истек');
    }

    // Проверяем, нет ли уже существующей сдачи
    const existingSubmission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: data.assignmentId,
        studentId: data.studentId,
      },
    });

    if (existingSubmission) {
      throw new BadRequestException('Вы уже сдали это задание. Используйте обновление сдачи.');
    }

    // Валидируем содержимое сдачи
    this.validateSubmissionContent(assignment.type, data.content);

    const submission = await this.prisma.assignmentSubmission.create({
      data: {
        assignmentId: data.assignmentId,
        enrollmentId: data.enrollmentId,
        studentId: data.studentId,
        content: data.content,
        attachments: data.attachments || [],
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        maxScore: 100, // Добавляем обязательное поле maxScore
        // timeSpent: data.timeSpent, // Поле не существует в Prisma модели
        // metadata: data.metadata || {}, // Поле не существует в Prisma модели
      },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    // Автоматическая проверка для некоторых типов заданий
    if (this.supportsAutoGrading(assignment.type)) {
      await this.autoGradeSubmission(submission.id);
    }

    this.logger.log(`Сдача создана: ${submission.id}`, {
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      status: submission.status,
    });

    return submission;
  }

  /**
   * Обновление сдачи задания
   */
  async updateSubmission(
    id: string,
    data: UpdateSubmissionRequest,
    userId: string
  ): Promise<AssignmentSubmission> {
    this.logger.log(`Обновление сдачи: ${id}`, { userId });

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Сдача не найдена');
    }

    // Проверяем права доступа
    if (submission.studentId !== userId) {
      throw new ForbiddenException('Нет прав на изменение этой сдачи');
    }

    // Проверяем, можно ли редактировать
    if (submission.status === SubmissionStatus.GRADED) {
      throw new ForbiddenException('Нельзя изменить уже проверенную сдачу');
    }

    // Проверяем дедлайн
    if (submission.assignment.dueDate && new Date() > submission.assignment.dueDate) {
      throw new ForbiddenException('Срок сдачи задания истек');
    }

    // Валидируем новое содержимое, если оно предоставлено
    if (data.content) {
      this.validateSubmissionContent(submission.assignment.type, data.content);
    }

    const updatedSubmission = await this.prisma.assignmentSubmission.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    this.logger.log(`Сдача обновлена: ${id}`);
    return updatedSubmission;
  }

  /**
   * Получение сдачи по ID
   */
  async getSubmissionById(id: string): Promise<AssignmentSubmission | null> {
    return this.prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });
  }

  /**
   * Получение списка сдач с фильтрацией
   */
  async getSubmissions(query: SubmissionQuery): Promise<{
    submissions: AssignmentSubmission[];
    total: number;
  }> {
    const where: any = {};

    if (query.assignmentId) {
      where.assignmentId = query.assignmentId;
    }

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.gradedBy) {
      where.gradedBy = query.gradedBy;
    }

    if (query.minScore !== undefined || query.maxScore !== undefined) {
      where.score = {};
      if (query.minScore !== undefined) {
        where.score.gte = query.minScore;
      }
      if (query.maxScore !== undefined) {
        where.score.lte = query.maxScore;
      }
    }

    if (query.submittedFrom || query.submittedTo) {
      where.submittedAt = {};
      if (query.submittedFrom) {
        where.submittedAt.gte = query.submittedFrom;
      }
      if (query.submittedTo) {
        where.submittedAt.lte = query.submittedTo;
      }
    }

    if (query.gradedFrom || query.gradedTo) {
      where.gradedAt = {};
      if (query.gradedFrom) {
        where.gradedAt.gte = query.gradedFrom;
      }
      if (query.gradedTo) {
        where.gradedAt.lte = query.gradedTo;
      }
    }

    const [submissions, total] = await Promise.all([
      this.prisma.assignmentSubmission.findMany({
        where,
        include: {
          assignment: {
            include: {
              course: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip: query.offset || 0,
        take: query.limit || 50,
      }),
      this.prisma.assignmentSubmission.count({ where }),
    ]);

    return { submissions, total };
  }

  /**
   * Проверка сдачи задания (выставление оценки)
   */
  async gradeSubmission(
    id: string,
    data: GradeSubmissionRequest
  ): Promise<AssignmentSubmission> {
    this.logger.log(`Проверка сдачи: ${id}`, {
      score: data.score,
      gradedBy: data.gradedBy,
    });

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Сдача не найдена');
    }

    if (submission.status !== SubmissionStatus.SUBMITTED) {
      throw new BadRequestException('Сдача должна иметь статус "Сдано" для проверки');
    }

    // Валидируем оценку
    if (data.score < 0 || data.score > submission.assignment.maxScore) {
      throw new BadRequestException(
        `Оценка должна быть от 0 до ${submission.assignment.maxScore}`
      );
    }

    const updatedSubmission = await this.prisma.assignmentSubmission.update({
      where: { id },
      data: {
        score: data.score,
        maxScore: submission.assignment.maxScore,
        feedback: data.feedback,
        // rubricScores: data.rubricScores, // Поле не существует в Prisma модели
        status: SubmissionStatus.GRADED,
        gradedBy: data.gradedBy,
        gradedAt: new Date(),
        // isPassing: data.score >= (submission.assignment.passingScore || 0), // Поле не существует в Prisma модели
      },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    this.logger.log(`Сдача проверена: ${id}`, {
      score: data.score,
      maxScore: submission.assignment.maxScore,
      // isPassing: updatedSubmission.isPassing, // Поле не существует в Prisma модели
    });

    return updatedSubmission;
  }

  /**
   * Автоматическая проверка для определенных типов заданий
   */
  async autoGradeSubmission(id: string): Promise<AssignmentSubmission> {
    this.logger.log(`Автопроверка сдачи: ${id}`);

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Сдача не найдена');
    }

    if (!this.supportsAutoGrading(submission.assignment.type)) {
      throw new BadRequestException('Этот тип задания не поддерживает автопроверку');
    }

    let score = 0;
    let feedback = '';

    // Автопроверка в зависимости от типа задания
    switch (submission.assignment.type) {
      case AssignmentType.QUIZ:
        const quizResult = this.gradeQuiz(submission.assignment.content, submission.content);
        score = quizResult.score;
        feedback = quizResult.feedback;
        break;

      case AssignmentType.CODE:
        // Здесь могла бы быть интеграция с системой проверки кода
        feedback = 'Автоматическая проверка кода недоступна';
        break;

      default:
        throw new BadRequestException('Неподдерживаемый тип задания для автопроверки');
    }

    const updatedSubmission = await this.prisma.assignmentSubmission.update({
      where: { id },
      data: {
        score,
        maxScore: submission.assignment.maxScore,
        feedback,
        status: SubmissionStatus.GRADED,
        gradedBy: 'system',
        gradedAt: new Date(),
        // isPassing: score >= (submission.assignment.passingScore || 0), // Поле не существует в Prisma модели
        // metadata: { // Поле не существует в Prisma модели
        //   autoGraded: true,
        // },
      },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    this.logger.log(`Автопроверка завершена: ${id}`, {
      score,
      maxScore: submission.assignment.maxScore,
      // isPassing: updatedSubmission.isPassing, // Поле не существует в Prisma модели
    });

    return updatedSubmission;
  }

  /**
   * Удаление сдачи (только для студентов до проверки)
   */
  async deleteSubmission(id: string, userId: string): Promise<void> {
    this.logger.log(`Удаление сдачи: ${id}`, { userId });

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Сдача не найдена');
    }

    if (submission.studentId !== userId) {
      throw new ForbiddenException('Нет прав на удаление этой сдачи');
    }

    if (submission.status === SubmissionStatus.GRADED) {
      throw new ForbiddenException('Нельзя удалить уже проверенную сдачу');
    }

    await this.prisma.assignmentSubmission.delete({
      where: { id },
    });

    this.logger.log(`Сдача удалена: ${id}`);
  }

  /**
   * Получение статистики по сдачам задания
   */
  async getSubmissionStats(assignmentId: string): Promise<{
    total: number;
    submitted: number;
    graded: number;
    pending: number;
    averageScore: number;
    passingRate: number;
  }> {
    const [stats, averageScore] = await Promise.all([
      this.prisma.assignmentSubmission.groupBy({
        by: ['status'],
        where: { assignmentId },
        _count: { status: true },
      }),
      this.prisma.assignmentSubmission.aggregate({
        where: { assignmentId, status: SubmissionStatus.GRADED },
        _avg: { score: true },
      }),
    ]);

    const total = stats.reduce((sum, stat) => sum + stat._count.status, 0);
    const submitted = stats.find(s => s.status === SubmissionStatus.SUBMITTED)?._count.status || 0;
    const graded = stats.find(s => s.status === SubmissionStatus.GRADED)?._count.status || 0;
    const pending = stats.find(s => s.status === SubmissionStatus.PENDING)?._count.status || 0;

    const passedCount = await this.prisma.assignmentSubmission.count({
      where: { assignmentId, status: SubmissionStatus.GRADED }, // isPassing не существует
    });

    return {
      total,
      submitted,
      graded,
      pending,
      averageScore: Number(averageScore._avg.score) || 0, // Конвертируем Decimal в number
      passingRate: graded > 0 ? (passedCount / graded) * 100 : 0,
    };
  }

  /**
   * Проверяет, поддерживает ли тип задания автоматическую проверку
   */
  private supportsAutoGrading(type: AssignmentType): boolean {
    return type === AssignmentType.QUIZ || type === AssignmentType.CODE;
  }

  /**
   * Валидация содержимого сдачи в зависимости от типа задания
   */
  private validateSubmissionContent(type: AssignmentType, content: any): void {
    switch (type) {
      case AssignmentType.QUIZ:
        if (!content.answers || !Array.isArray(content.answers)) {
          throw new BadRequestException('Для викторины необходимо предоставить массив ответов');
        }
        break;

      case AssignmentType.ESSAY:
        if (!content.text || typeof content.text !== 'string') {
          throw new BadRequestException('Для эссе необходимо предоставить текст');
        }
        break;

      case AssignmentType.CODE:
        if (!content.code || typeof content.code !== 'string') {
          throw new BadRequestException('Для задания по программированию необходимо предоставить код');
        }
        break;

      case AssignmentType.UPLOAD:
        if (!content.files || !Array.isArray(content.files)) {
          throw new BadRequestException('Для задания с загрузкой необходимо предоставить файлы');
        }
        break;

      case AssignmentType.PROJECT:
        if (!content.description && !content.files) {
          throw new BadRequestException('Для проекта необходимо предоставить описание или файлы');
        }
        break;

      default:
        // Для остальных типов базовая валидация
        if (!content || Object.keys(content).length === 0) {
          throw new BadRequestException('Содержимое сдачи не может быть пустым');
        }
    }
  }

  /**
   * Проверка викторины
   */
  private gradeQuiz(assignmentContent: any, submissionContent: any): { score: number; feedback: string } {
    if (!assignmentContent.questions || !submissionContent.answers) {
      return { score: 0, feedback: 'Неверный формат викторины' };
    }

    const questions = assignmentContent.questions;
    const answers = submissionContent.answers;
    let correctCount = 0;
    const feedback: string[] = [];

    questions.forEach((question: any, index: number) => {
      const userAnswer = answers[index];
      const correctAnswer = question.correctAnswer;

      if (userAnswer === correctAnswer) {
        correctCount++;
        feedback.push(`Вопрос ${index + 1}: Правильно`);
      } else {
        feedback.push(`Вопрос ${index + 1}: Неправильно (правильный ответ: ${correctAnswer})`);
      }
    });

    const score = Math.round((correctCount / questions.length) * assignmentContent.maxScore || 100);
    
    return {
      score,
      feedback: feedback.join('\n'),
    };
  }
}