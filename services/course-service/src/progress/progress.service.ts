import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, StudentProgress, Prisma } from '@prisma/client';

export interface EnrollmentData {
  userId: string;
  courseId: string;
  enrollmentType: 'FREE' | 'PAID';
  paymentId?: string;
}

export interface ProgressUpdateData {
  lessonId: string;
  timeSpent: number;
  completed: boolean;
  score?: number;
}

export interface ProgressSummary {
  courseId: string;
  userId: string;
  enrolledAt: Date;
  lastAccessedAt?: Date;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DROPPED';
  timeSpent: number;
  certificateIssued: boolean;
}

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Запись студента на курс
   */
  async enrollStudent(enrollmentData: EnrollmentData): Promise<any> {
    const { userId, courseId, enrollmentType, paymentId } = enrollmentData;

    this.logger.debug(`Enrolling student ${userId} to course ${courseId}`);

    // Проверяем, что курс существует и опубликован
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          where: { isPublished: true },
          select: { id: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    if (!course.isPublished) {
      throw new BadRequestException('Course is not published');
    }

    // Проверяем, не записан ли уже студент
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: userId,
        courseId,
        status: { not: 'DROPPED' },
      },
    });

    if (existingEnrollment) {
      throw new BadRequestException('Student is already enrolled in this course');
    }

    // Создаем запись на курс
    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: userId,
        courseId,
        // enrollmentType - doesn't exist in schema
        paymentId,
        status: 'ACTIVE',
      },
    });

    // Создаем запись прогресса
    const progress = await this.prisma.studentProgress.create({
      data: {
        studentId: userId,
        courseId,
        enrollmentId: enrollment.id,
        completedLessons: 0,
        totalLessons: course.lessons.length,
        progressPercentage: 0,
        status: 'ACTIVE',
        totalTimeSpent: 0,
        certificateIssued: false,
      },
    });

    this.logger.log(`Student ${userId} enrolled to course ${courseId}`);

    return {
      enrollment,
      progress,
    };
  }

  /**
   * Обновление прогресса по уроку
   */
  async updateLessonProgress(
    userId: string,
    courseId: string,
    progressData: ProgressUpdateData,
  ): Promise<ProgressSummary> {
    const { lessonId, timeSpent, completed, score } = progressData;

    this.logger.debug(`Updating lesson progress for user ${userId}, lesson ${lessonId}`);

    // Проверяем запись на курс
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: userId,
        courseId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Student is not enrolled in this course');
    }

    // Проверяем существование урока
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('Lesson not found in this course');
    }

    // Обновляем или создаем прогресс по уроку
    await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          studentId: userId,
          lessonId,
        },
      },
      update: {
        timeSpent: { increment: timeSpent },
        completed,
        score,
        lastAccessedAt: new Date(),
      },
      create: {
        studentId: userId,
        lessonId,
        enrollmentId: enrollment.id,
        timeSpent,
        completed,
        score,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });

    // Пересчитываем общий прогресс
    return await this.recalculateProgress(userId, courseId);
  }

  /**
   * Получение прогресса студента по курсу
   */
  async getStudentProgress(userId: string, courseId: string): Promise<ProgressSummary | null> {
    const progress = await this.prisma.studentProgress.findFirst({
      where: {
        studentId: userId,
        courseId,
      },
      include: {
        enrollment: true,
      },
    });

    if (!progress) {
      return null;
    }

    return {
      courseId: progress.courseId,
      userId: progress.studentId,
      enrolledAt: progress.enrollment.enrolledAt,
      lastAccessedAt: progress.lastAccessedAt,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      progressPercentage: Number(progress.progressPercentage),
      status: progress.status as 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DROPPED',
      timeSpent: progress.totalTimeSpent,
      certificateIssued: progress.certificateIssued,
    };
  }

  /**
   * Получение всех курсов пользователя
   */
  async getUserCourses(userId: string): Promise<{
    enrolled: any[];
    completed: any[];
    inProgress: any[];
  }> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: userId,
        status: { not: 'DROPPED' },
      },
      include: {
        course: {
          include: {
            _count: {
              select: {
                lessons: true,
                reviews: true,
              },
            },
          },
        },
        progress: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const enrolled: any[] = [];
    const completed: any[] = [];
    const inProgress: any[] = [];

    enrollments.forEach(enrollment => {
      const courseData = {
        ...enrollment.course,
        lessonCount: enrollment.course._count.lessons,
        reviewCount: enrollment.course._count.reviews,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress?.[0] ? {
          completedLessons: enrollment.progress[0].completedLessons,
          totalLessons: enrollment.progress[0].totalLessons,
          progressPercentage: Number(enrollment.progress[0].progressPercentage),
          timeSpent: enrollment.progress[0].totalTimeSpent,
        } : null,
      };

      enrolled.push(courseData);

      if (enrollment.progress?.[0]?.status === 'COMPLETED') {
        completed.push(courseData);
      } else if (enrollment.progress?.[0] && Number(enrollment.progress[0].progressPercentage) > 0) {
        inProgress.push(courseData);
      }
    });

    return {
      enrolled,
      completed,
      inProgress,
    };
  }

  /**
   * Получение прогресса по урокам курса
   */
  async getLessonProgress(userId: string, courseId: string): Promise<any[]> {
    const lessonProgress = await this.prisma.lessonProgress.findMany({
      where: {
        studentId: userId,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
          },
        },
      },
      orderBy: {
        lesson: {
          order: 'asc',
        },
      },
    });

    return lessonProgress.map(progress => ({
      lessonId: progress.lessonId,
      lesson: progress.lesson || { id: progress.lessonId, title: 'Unknown', duration: 0 },
      timeSpent: progress.timeSpent,
      completed: progress.completed,
      score: progress.score,
      startedAt: progress.startedAt,
      lastAccessedAt: progress.lastAccessedAt,
      progressPercentage: (progress.lesson && progress.lesson.duration)
        ? Math.min(100, (progress.timeSpent / progress.lesson.duration) * 100)
        : progress.completed ? 100 : 0,
    }));
  }

  /**
   * Отмена записи на курс
   */
  async unenrollStudent(userId: string, courseId: string): Promise<void> {
    this.logger.debug(`Unenrolling student ${userId} from course ${courseId}`);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: userId,
        courseId,
        status: { not: 'DROPPED' },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Student is not enrolled in this course');
    }

    // Обновляем статус записи и прогресса
    await this.prisma.$transaction([
      this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'DROPPED',
          // droppedAt doesn't exist in schema
        },
      }),
      this.prisma.studentProgress.updateMany({
        where: {
          studentId: userId,
          courseId,
        },
        data: {
          status: 'DROPPED',
        },
      }),
    ]);

    this.logger.log(`Student ${userId} unenrolled from course ${courseId}`);
  }

  /**
   * Выдача сертификата
   */
  async issueCertificate(userId: string, courseId: string): Promise<any> {
    const progress = await this.prisma.studentProgress.findFirst({
      where: {
        studentId: userId,
        courseId,
        status: 'COMPLETED',
        certificateIssued: false,
      },
    });

    if (!progress) {
      throw new BadRequestException('Course not completed or certificate already issued');
    }

    // Получаем данные курса для сертификата
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true }
    });

    const certificate = await this.prisma.courseCertificate.create({
      data: {
        userId,
        certificateId: this.generateCertificateNumber(userId, courseId),
        certificateNumber: this.generateCertificateNumber(userId, courseId),
        title: `Сертификат о завершении курса: ${course?.title || 'Неизвестный курс'}`,
        issueDate: new Date(),
        course: {
          connect: { id: courseId }
        },
        enrollment: {
          connect: { id: progress.enrollmentId }
        }
      },
    });

    // Обновляем прогресс
    await this.prisma.studentProgress.update({
      where: { id: progress.id },
      data: { certificateIssued: true },
    });

    this.logger.log(`Certificate issued for user ${userId}, course ${courseId}`);

    return certificate;
  }

  /**
   * Пересчет прогресса по курсу
   */
  private async recalculateProgress(userId: string, courseId: string): Promise<ProgressSummary> {
    const [lessonProgress, totalLessons, enrollment] = await this.prisma.$transaction([
      this.prisma.lessonProgress.findMany({
        where: {
          studentId: userId,
        },
      }),
      this.prisma.lesson.count({
        where: {
          courseId,
          isPublished: true,
        },
      }),
      this.prisma.enrollment.findFirst({
        where: {
          studentId: userId,
          courseId,
          status: 'ACTIVE',
        },
      }),
    ]);

    const completedLessons = lessonProgress.filter(p => p.completed).length;
    const totalTimeSpent = lessonProgress.reduce((sum, p) => sum + p.timeSpent, 0);
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    // Определяем статус
    let status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DROPPED' = 'ACTIVE';
    
    if (progressPercentage >= 100) {
      status = 'COMPLETED';
    } else if (progressPercentage === 0) {
      status = 'ACTIVE';
    } else {
      // Проверяем активность за последние 30 дней
      const lastActivity = lessonProgress
        .filter(p => p.lastAccessedAt)
        .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime())[0];
      
      if (lastActivity) {
        const daysSinceLastActivity = Math.floor(
          (Date.now() - lastActivity.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastActivity > 30) {
          status = 'PAUSED';
        }
      }
    }

    // Обновляем прогресс
    const updatedProgress = await this.prisma.studentProgress.upsert({
      where: {
        userId_courseId: {
          studentId: userId,
          courseId,
        },
      },
      update: {
        completedLessons,
        totalLessons,
        progressPercentage,
        status,
        totalTimeSpent,
        lastAccessedAt: new Date(),
      },
      create: {
        studentId: userId,
        courseId,
        enrollmentId: enrollment.id,
        completedLessons,
        totalLessons,
        progressPercentage,
        status,
        totalTimeSpent,
        certificateIssued: false,
      },
      include: {
        enrollment: true,
      },
    });

    return {
      courseId: updatedProgress.courseId,
      userId: updatedProgress.studentId,
      enrolledAt: updatedProgress.enrollment?.enrolledAt || new Date(),
      lastAccessedAt: updatedProgress.lastAccessedAt,
      completedLessons: updatedProgress.completedLessons,
      totalLessons: updatedProgress.totalLessons,
      progressPercentage: Number(updatedProgress.progressPercentage),
      status: updatedProgress.status as 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DROPPED',
      timeSpent: updatedProgress.totalTimeSpent,
      certificateIssued: updatedProgress.certificateIssued,
    };
  }

  /**
   * Генерация номера сертификата
   */
  private generateCertificateNumber(userId: string, courseId: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const userHash = userId.substring(0, 4).toUpperCase();
    const courseHash = courseId.substring(0, 4).toUpperCase();
    
    return `GONGBU-${userHash}${courseHash}-${timestamp}`;
  }

  /**
   * Генерация кода валидации
   */
  private generateValidationCode(): string {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }
}