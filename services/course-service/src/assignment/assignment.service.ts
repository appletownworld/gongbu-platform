import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto, UpdateAssignmentDto, SubmitAssignmentDto } from './dto/assignment.dto';

export interface Assignment {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  instructions: string;
  type: 'text' | 'file_upload' | 'image' | 'video' | 'code';
  maxFileSize?: number; // в MB
  allowedFileTypes?: string[];
  dueDate?: Date;
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  files?: string[];
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  score?: number;
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  submittedAt: Date;
}

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Создать задание для урока
   */
  async createAssignment(lessonId: string, createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    this.logger.log(`Создание задания для урока: ${lessonId}`);

    // Проверяем существование урока
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    // Создаем задание
    const assignment = await this.prisma.assignment.create({
      data: {
        lessonId,
        title: createAssignmentDto.title,
        description: createAssignmentDto.description,
        instructions: createAssignmentDto.instructions,
        type: createAssignmentDto.type,
        maxFileSize: createAssignmentDto.maxFileSize,
        allowedFileTypes: createAssignmentDto.allowedFileTypes,
        dueDate: createAssignmentDto.dueDate,
        points: createAssignmentDto.points,
        isActive: true,
      },
    });

    this.logger.log(`Задание создано: ${assignment.id}`);
    return this.mapAssignmentToResponse(assignment);
  }

  /**
   * Получить задание по ID
   */
  async getAssignment(assignmentId: string): Promise<Assignment> {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    return this.mapAssignmentToResponse(assignment);
  }

  /**
   * Получить задания для урока
   */
  async getAssignmentsByLesson(lessonId: string): Promise<Assignment[]> {
    const assignments = await this.prisma.assignment.findMany({
      where: { 
        lessonId,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return assignments.map(assignment => this.mapAssignmentToResponse(assignment));
  }

  /**
   * Обновить задание
   */
  async updateAssignment(assignmentId: string, updateAssignmentDto: UpdateAssignmentDto): Promise<Assignment> {
    this.logger.log(`Обновление задания: ${assignmentId}`);

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    const updatedAssignment = await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(updateAssignmentDto.title && { title: updateAssignmentDto.title }),
        ...(updateAssignmentDto.description && { description: updateAssignmentDto.description }),
        ...(updateAssignmentDto.instructions && { instructions: updateAssignmentDto.instructions }),
        ...(updateAssignmentDto.type && { type: updateAssignmentDto.type }),
        ...(updateAssignmentDto.maxFileSize !== undefined && { maxFileSize: updateAssignmentDto.maxFileSize }),
        ...(updateAssignmentDto.allowedFileTypes && { allowedFileTypes: updateAssignmentDto.allowedFileTypes }),
        ...(updateAssignmentDto.dueDate !== undefined && { dueDate: updateAssignmentDto.dueDate }),
        ...(updateAssignmentDto.points !== undefined && { points: updateAssignmentDto.points }),
        ...(updateAssignmentDto.isActive !== undefined && { isActive: updateAssignmentDto.isActive }),
      },
    });

    this.logger.log(`Задание обновлено: ${assignmentId}`);
    return this.mapAssignmentToResponse(updatedAssignment);
  }

  /**
   * Удалить задание
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    this.logger.log(`Удаление задания: ${assignmentId}`);

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    });

    this.logger.log(`Задание удалено: ${assignmentId}`);
  }

  /**
   * Отправить выполненное задание
   */
  async submitAssignment(
    assignmentId: string,
    userId: string,
    submitAssignmentDto: SubmitAssignmentDto
  ): Promise<AssignmentSubmission> {
    this.logger.log(`Отправка задания: ${assignmentId} пользователем: ${userId}`);

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    // Проверяем, не отправлял ли пользователь уже это задание
    const existingSubmission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        userId,
      },
    });

    if (existingSubmission) {
      throw new BadRequestException('Задание уже отправлено');
    }

    // Проверяем срок сдачи
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      throw new BadRequestException('Срок сдачи задания истек');
    }

    // Валидируем файлы
    if (submitAssignmentDto.files && assignment.allowedFileTypes) {
      const invalidFiles = submitAssignmentDto.files.filter(file => {
        const fileExtension = file.split('.').pop()?.toLowerCase();
        return !assignment.allowedFileTypes?.includes(`.${fileExtension}`);
      });

      if (invalidFiles.length > 0) {
        throw new BadRequestException(`Недопустимые типы файлов: ${invalidFiles.join(', ')}`);
      }
    }

    // Создаем отправку задания
    const submission = await this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId,
        content: submitAssignmentDto.content,
        files: submitAssignmentDto.files,
        status: 'submitted',
        submittedAt: new Date(),
      },
    });

    this.logger.log(`Задание отправлено: ${submission.id}`);
    return this.mapSubmissionToResponse(submission);
  }

  /**
   * Получить отправки задания для преподавателя
   */
  async getAssignmentSubmissions(
    assignmentId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ submissions: AssignmentSubmission[]; total: number }> {
    const where: any = { assignmentId };
    if (status) {
      where.status = status;
    }

    const [submissions, total] = await Promise.all([
      this.prisma.assignmentSubmission.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.assignmentSubmission.count({ where }),
    ]);

    return {
      submissions: submissions.map(submission => this.mapSubmissionToResponse(submission)),
      total,
    };
  }

  /**
   * Проверить задание (для преподавателя)
   */
  async reviewAssignment(
    submissionId: string,
    reviewerId: string,
    reviewData: {
      status: 'approved' | 'rejected';
      score?: number;
      feedback?: string;
    }
  ): Promise<AssignmentSubmission> {
    this.logger.log(`Проверка задания: ${submissionId} преподавателем: ${reviewerId}`);

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Отправка задания не найдена');
    }

    const updatedSubmission = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: reviewData.status,
        score: reviewData.score,
        feedback: reviewData.feedback,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    // Если задание одобрено, обновляем прогресс урока
    if (reviewData.status === 'approved') {
      await this.updateLessonProgress(submission.userId, submission.assignmentId);
    }

    this.logger.log(`Задание проверено: ${submissionId}, статус: ${reviewData.status}`);
    return this.mapSubmissionToResponse(updatedSubmission);
  }

  /**
   * Получить отправки пользователя
   */
  async getUserSubmissions(userId: string): Promise<AssignmentSubmission[]> {
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { userId },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            points: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return submissions.map(submission => this.mapSubmissionToResponse(submission));
  }

  /**
   * Получить статистику заданий для преподавателя
   */
  async getAssignmentStats(assignmentId: string): Promise<any> {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Задание не найдено');
    }

    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const totalSubmissions = submissions.length;
    const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;
    const rejectedSubmissions = submissions.filter(s => s.status === 'rejected').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'submitted').length;

    const averageScore = submissions
      .filter(s => s.score !== null)
      .reduce((sum, s) => sum + (s.score || 0), 0) / 
      (submissions.filter(s => s.score !== null).length || 1);

    return {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        points: assignment.points,
        dueDate: assignment.dueDate,
      },
      stats: {
        totalSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        pendingSubmissions,
        approvalRate: totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0,
        averageScore,
      },
      recentSubmissions: submissions
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        .slice(0, 10)
        .map(submission => ({
          id: submission.id,
          user: submission.user,
          status: submission.status,
          score: submission.score,
          submittedAt: submission.submittedAt,
          reviewedAt: submission.reviewedAt,
        })),
    };
  }

  // Приватные методы

  private async updateLessonProgress(userId: string, assignmentId: string): Promise<void> {
    // Получаем урок по заданию
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { lessonId: true },
    });

    if (!assignment) return;

    // Обновляем прогресс урока
    await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: assignment.lessonId,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId: assignment.lessonId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    this.logger.log(`Прогресс урока обновлен: ${userId} -> ${assignment.lessonId}`);
  }

  private mapAssignmentToResponse(assignment: any): Assignment {
    return {
      id: assignment.id,
      lessonId: assignment.lessonId,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      type: assignment.type,
      maxFileSize: assignment.maxFileSize,
      allowedFileTypes: assignment.allowedFileTypes,
      dueDate: assignment.dueDate,
      points: assignment.points,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }

  private mapSubmissionToResponse(submission: any): AssignmentSubmission {
    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      userId: submission.userId,
      content: submission.content,
      files: submission.files,
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      reviewedBy: submission.reviewedBy,
      reviewedAt: submission.reviewedAt,
      submittedAt: submission.submittedAt,
    };
  }
}
