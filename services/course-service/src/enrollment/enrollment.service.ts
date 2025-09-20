import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException,
  ConflictException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { Enrollment, EnrollmentStatus } from '@prisma/client';
import { AuthService } from '../auth/auth-client.service';

// Interfaces
export interface EnrollmentRequest {
  studentId: string;
  courseId: string;
  enrollmentType: 'FREE' | 'PAID';
  paymentId?: string;
  discountCode?: string;
  paidAmount?: number;
  settings?: Record<string, any>;
}

export interface EnrollmentUpdateRequest {
  status?: EnrollmentStatus;
  settings?: Record<string, any>;
}

export interface EnrollmentQuery {
  studentId?: string;
  courseId?: string;
  status?: EnrollmentStatus;
  search?: string;
  enrolledAfter?: Date;
  enrolledBefore?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'enrolledAt' | 'updatedAt' | 'completedAt';
  orderDirection?: 'asc' | 'desc';
  includeProgress?: boolean;
  includePayment?: boolean;
}

export interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  droppedEnrollments: number;
  pausedEnrollments: number;
  averageCompletionTime: number;
  completionRate: number;
  dropoutRate: number;
  revenueGenerated: number;
  freeEnrollments: number;
  paidEnrollments: number;
}

export interface BulkEnrollmentRequest {
  courseId: string;
  studentIds: string[];
  enrollmentType: 'FREE' | 'PAID';
  settings?: Record<string, any>;
}

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  /**
   * Записать студента на курс
   */
  async enrollStudent(enrollmentData: EnrollmentRequest): Promise<Enrollment> {
    this.logger.log(`Запись студента на курс: ${enrollmentData.studentId} -> ${enrollmentData.courseId}`);

    // Проверяем, существует ли курс
    const course = await this.prisma.course.findUnique({
      where: { id: enrollmentData.courseId },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    // Проверяем, не записан ли уже студент
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: enrollmentData.studentId,
        courseId: enrollmentData.courseId,
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.ACTIVE) {
        throw new ConflictException('Студент уже записан на этот курс');
      } else if (existingEnrollment.status === EnrollmentStatus.COMPLETED) {
        throw new ConflictException('Студент уже завершил этот курс');
      } else {
        // Реактивируем запись, если она была приостановлена или отменена
        return this.updateEnrollment(existingEnrollment.id, 
          { status: EnrollmentStatus.ACTIVE }, 
          enrollmentData.studentId
        );
      }
    }

    // Проверяем права доступа к курсу
    if (course.isPremium && enrollmentData.enrollmentType === 'FREE') {
      throw new ForbiddenException('Для записи на премиум курс требуется оплата');
    }

    // Создаем запись на курс
    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: enrollmentData.studentId,
        courseId: enrollmentData.courseId,
        status: EnrollmentStatus.ACTIVE,
        paymentId: enrollmentData.paymentId,
        discountCode: enrollmentData.discountCode,
        paidAmount: enrollmentData.paidAmount ? enrollmentData.paidAmount.toString() : undefined,
        settings: enrollmentData.settings || {},
        enrolledAt: new Date(),
      },
      include: {
        course: {
          select: { id: true, title: true, slug: true, isPremium: true, price: true },
        },
      },
    });

    // Создаем начальный прогресс студента
    await this.createInitialProgress(enrollment.id, enrollmentData.studentId, enrollmentData.courseId);

    // Обновляем счетчик записей на курс
    await this.prisma.course.update({
      where: { id: enrollmentData.courseId },
      data: { enrollmentCount: { increment: 1 } },
    });

    this.logger.log(`Студент успешно записан на курс: ${enrollment.id}`);
    return enrollment;
  }

  /**
   * Массовая запись студентов на курс
   */
  async bulkEnrollStudents(bulkData: BulkEnrollmentRequest, creatorId: string): Promise<{
    successful: Enrollment[];
    failed: { studentId: string; error: string; }[];
  }> {
    this.logger.log(`Массовая запись студентов на курс: ${bulkData.courseId}`, {
      studentCount: bulkData.studentIds.length,
      creatorId,
    });

    // Проверяем права создателя на курс
    await this.validateCourseAccess(bulkData.courseId, creatorId);

    const successful: Enrollment[] = [];
    const failed: { studentId: string; error: string; }[] = [];

    for (const studentId of bulkData.studentIds) {
      try {
        const enrollment = await this.enrollStudent({
          studentId,
          courseId: bulkData.courseId,
          enrollmentType: bulkData.enrollmentType,
          settings: bulkData.settings,
        });
        successful.push(enrollment);
      } catch (error) {
        failed.push({
          studentId,
          error: error.message || 'Неизвестная ошибка',
        });
      }
    }

    this.logger.log(`Массовая запись завершена: ${successful.length} успешно, ${failed.length} с ошибками`);

    return { successful, failed };
  }

  /**
   * Получить запись студента на курс
   */
  async getEnrollment(
    enrollmentId: string, 
    requesterId?: string,
    options: { includeProgress?: boolean; includePayment?: boolean } = {}
  ): Promise<Enrollment | null> {
    const include: any = {
      course: {
        select: { id: true, title: true, slug: true, isPremium: true, price: true },
      },
    };

    if (options.includeProgress) {
      include.progress = {
        orderBy: { updatedAt: 'desc' },
        take: 1,
      };
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include,
    });

    if (!enrollment) return null;

    // Проверяем права доступа
    if (requesterId && enrollment.studentId !== requesterId) {
      // Проверяем, является ли запрашивающий создателем курса
      const isCreator = await this.prisma.course.findFirst({
        where: {
          id: enrollment.courseId,
          creatorId: requesterId,
        },
      });

      if (!isCreator) {
        throw new ForbiddenException('Нет прав для просмотра этой записи');
      }
    }

    return enrollment;
  }

  /**
   * Получить записи студента
   */
  async getStudentEnrollments(
    studentId: string, 
    query: Omit<EnrollmentQuery, 'studentId'> = {}
  ): Promise<{ enrollments: Enrollment[]; total: number }> {
    const where: any = { studentId };

    if (query.courseId) where.courseId = query.courseId;
    if (query.status) where.status = query.status;
    if (query.enrolledAfter) where.enrolledAt = { gte: query.enrolledAfter };
    if (query.enrolledBefore) where.enrolledAt = { ...where.enrolledAt, lte: query.enrolledBefore };

    if (query.search) {
      where.course = {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const include: any = {
      course: {
        select: { 
          id: true, 
          title: true, 
          slug: true, 
          isPremium: true, 
          price: true,
          coverImageUrl: true,
          estimatedDuration: true,
        },
      },
    };

    if (query.includeProgress) {
      include.progress = {
        orderBy: { updatedAt: 'desc' },
        take: 1,
      };
    }

    const orderBy: any = {};
    orderBy[query.orderBy || 'enrolledAt'] = query.orderDirection || 'desc';

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        include,
        orderBy,
        skip: query.offset || 0,
        take: query.limit || 50,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return { enrollments, total };
  }

  /**
   * Получить записи на курс
   */
  async getCourseEnrollments(
    courseId: string,
    creatorId: string,
    query: Omit<EnrollmentQuery, 'courseId'> = {}
  ): Promise<{ enrollments: Enrollment[]; total: number }> {
    // Проверяем права создателя
    await this.validateCourseAccess(courseId, creatorId);

    const where: any = { courseId };

    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;
    if (query.enrolledAfter) where.enrolledAt = { gte: query.enrolledAfter };
    if (query.enrolledBefore) where.enrolledAt = { ...where.enrolledAt, lte: query.enrolledBefore };

    const include: any = {};

    if (query.includeProgress) {
      include.progress = {
        orderBy: { updatedAt: 'desc' },
        take: 1,
      };
    }

    const orderBy: any = {};
    orderBy[query.orderBy || 'enrolledAt'] = query.orderDirection || 'desc';

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        include,
        orderBy,
        skip: query.offset || 0,
        take: query.limit || 50,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return { enrollments, total };
  }

  /**
   * Обновить запись на курс
   */
  async updateEnrollment(
    enrollmentId: string, 
    updateData: EnrollmentUpdateRequest,
    requesterId: string
  ): Promise<Enrollment> {
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });

    if (!existingEnrollment) {
      throw new NotFoundException('Запись на курс не найдена');
    }

    // Проверяем права доступа
    if (existingEnrollment.studentId !== requesterId) {
      // Проверяем, является ли запрашивающий создателем курса
      const isCreator = existingEnrollment.course.creatorId === requesterId;
      if (!isCreator) {
        throw new ForbiddenException('Нет прав для обновления этой записи');
      }
    }

    const updatePayload: any = {};

    if (updateData.status !== undefined) {
      updatePayload.status = updateData.status;

      // Устанавливаем дату завершения при завершении курса
      if (updateData.status === EnrollmentStatus.COMPLETED && !existingEnrollment.completedAt) {
        updatePayload.completedAt = new Date();
      }
    }

    if (updateData.settings) {
      updatePayload.settings = updateData.settings;
    }

    const enrollment = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: updatePayload,
      include: {
        course: {
          select: { id: true, title: true, slug: true, isPremium: true, price: true },
        },
      },
    });

    this.logger.log(`Запись на курс обновлена: ${enrollmentId}`, { 
      status: updateData.status,
      requesterId,
    });

    return enrollment;
  }

  /**
   * Отписать студента от курса
   */
  async unenrollStudent(enrollmentId: string, requesterId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Запись на курс не найдена');
    }

    // Проверяем права доступа
    if (enrollment.studentId !== requesterId) {
      // Проверяем, является ли запрашивающий создателем курса
      const isCreator = enrollment.course.creatorId === requesterId;
      if (!isCreator) {
        throw new ForbiddenException('Нет прав для отписки от этого курса');
      }
    }

    // Обновляем статус на DROPPED вместо удаления
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.DROPPED },
    });

    // Обновляем счетчик записей на курс
    await this.prisma.course.update({
      where: { id: enrollment.courseId },
      data: { enrollmentCount: { decrement: 1 } },
    });

    this.logger.log(`Студент отписан от курса: ${enrollmentId}`, { requesterId });
  }

  /**
   * Полностью удалить запись (только для админов)
   */
  async deleteEnrollment(enrollmentId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        progress: true,
        lessonProgress: true,
        submissions: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Запись на курс не найдена');
    }

    // Удаляем связанные данные в транзакции
    await this.prisma.$transaction([
      // Удаляем прогресс
      this.prisma.lessonProgress.deleteMany({
        where: { enrollmentId },
      }),
      this.prisma.assignmentSubmission.deleteMany({
        where: { enrollmentId },
      }),
      this.prisma.studentProgress.deleteMany({
        where: { enrollmentId },
      }),
      // Удаляем запись
      this.prisma.enrollment.delete({
        where: { id: enrollmentId },
      }),
    ]);

    // Обновляем счетчик записей на курс
    await this.prisma.course.update({
      where: { id: enrollment.courseId },
      data: { enrollmentCount: { decrement: 1 } },
    });

    this.logger.log(`Запись на курс полностью удалена: ${enrollmentId}`);
  }

  /**
   * Получить статистику записей
   */
  async getEnrollmentStats(courseId?: string, creatorId?: string): Promise<EnrollmentStats> {
    // Базовый фильтр
    const where: any = {};
    
    if (courseId) {
      if (creatorId) {
        // Проверяем права создателя
        await this.validateCourseAccess(courseId, creatorId);
      }
      where.courseId = courseId;
    } else if (creatorId) {
      // Статистика по всем курсам создателя
      where.course = { creatorId };
    }

    const [
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      droppedEnrollments,
      paidEnrollments,
      completionTimes,
      revenueData,
    ] = await Promise.all([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.count({ where: { ...where, status: EnrollmentStatus.ACTIVE } }),
      this.prisma.enrollment.count({ where: { ...where, status: EnrollmentStatus.COMPLETED } }),
      this.prisma.enrollment.count({ where: { ...where, status: EnrollmentStatus.DROPPED } }),
      // this.prisma.enrollment.count({ where: { ...where, status: EnrollmentStatus.PAUSED } }), // PAUSED doesn't exist
      this.prisma.enrollment.count({ where: { ...where, paidAmount: { not: null } } }),
      this.prisma.enrollment.findMany({
        where: { ...where, status: EnrollmentStatus.COMPLETED },
        select: {
          enrolledAt: true,
          completedAt: true,
        },
      }),
      this.prisma.enrollment.aggregate({
        where: { ...where, paidAmount: { not: null } },
        _sum: { paidAmount: true },
      }),
    ]);

    // Вычисляем среднее время завершения
    const completionTimesMs = completionTimes
      .filter(e => e.completedAt)
      .map(e => e.completedAt!.getTime() - e.enrolledAt.getTime());
    
    const averageCompletionTime = completionTimesMs.length > 0
      ? completionTimesMs.reduce((sum, time) => sum + time, 0) / completionTimesMs.length / (1000 * 60 * 60 * 24) // в днях
      : 0;

    // Вычисляем показатели
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
    const dropoutRate = totalEnrollments > 0 ? (droppedEnrollments / totalEnrollments) * 100 : 0;
    const revenueGenerated = Number(revenueData?._sum?.paidAmount || 0);
    const freeEnrollments = totalEnrollments - Number(paidEnrollments);

    return {
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      droppedEnrollments,
      pausedEnrollments: 0, // Field doesn't exist
      averageCompletionTime,
      completionRate,
      dropoutRate,
      revenueGenerated,
      freeEnrollments,
      paidEnrollments,
    };
  }

  /**
   * Проверить доступ к курсу
   */
  private async validateCourseAccess(courseId: string, creatorId: string): Promise<void> {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        creatorId,
      },
    });

    if (!course) {
      throw new ForbiddenException('Нет прав доступа к этому курсу');
    }
  }

  /**
   * Создать начальный прогресс студента
   */
  private async createInitialProgress(
    enrollmentId: string, 
    studentId: string, 
    courseId: string
  ): Promise<void> {
    // Получаем общее количество уроков и заданий в курсе
    const [lessonCount, assignmentCount] = await Promise.all([
      this.prisma.lesson.count({
        where: { courseId, isPublished: true },
      }),
      this.prisma.assignment.count({
        where: { courseId, isPublished: true },
      }),
    ]);

    // Создаем запись прогресса
    await this.prisma.studentProgress.create({
      data: {
        studentId,
        courseId,
        enrollmentId,
        totalLessons: lessonCount,
        totalAssignments: assignmentCount,
        completedLessons: 0,
        completedAssignments: 0,
        progressPercentage: 0,
        status: 'ACTIVE',
        totalTimeSpent: 0,
        // startedAt: new Date(), // Field doesn't exist
      },
    });
  }

  /**
   * Проверить, записан ли студент на курс
   */
  async isStudentEnrolled(studentId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] }, // PAUSED doesn't exist
      },
    });

    return !!enrollment;
  }

  /**
   * Получить активную запись студента на курс
   */
  async getActiveEnrollment(studentId: string, courseId: string): Promise<Enrollment | null> {
    return this.prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        status: { in: [EnrollmentStatus.ACTIVE] }, // PAUSED doesn't exist
      },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
        progress: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
