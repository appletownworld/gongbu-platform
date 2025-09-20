import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, StudentProgress, Prisma, LessonStatus, SubmissionStatus } from '@prisma/client';

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

export interface DetailedProgressAnalytics {
  courseId: string;
  studentId: string;
  overview: {
    enrolledAt: Date;
    lastAccessedAt?: Date;
    totalTimeSpent: number; // in minutes
    progressPercentage: number;
    status: string;
    certificateIssued: boolean;
  };
  lessons: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    averageWatchTime: number;
    progressDetails: LessonProgressDetail[];
  };
  assignments: {
    total: number;
    submitted: number;
    graded: number;
    pending: number;
    averageScore: number;
    passedCount: number;
    assignmentDetails: AssignmentProgressDetail[];
  };
  performance: {
    overallScore: number;
    streaks: {
      current: number;
      longest: number;
    };
    learningVelocity: number; // lessons/assignments per week
    timeDistribution: {
      weekdays: number;
      weekends: number;
      mornings: number;
      afternoons: number;
      evenings: number;
    };
  };
  achievements: {
    milestones: string[];
    badges: string[];
    certificates: string[];
  };
}

export interface LessonProgressDetail {
  lessonId: string;
  lessonTitle: string;
  order: number;
  status: LessonStatus;
  progressPercentage: number;
  completed: boolean;
  timeSpent: number; // in minutes
  watchTime: number; // in seconds for video content
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  score?: number;
}

export interface AssignmentProgressDetail {
  assignmentId: string;
  assignmentTitle: string;
  assignmentType: string;
  maxScore: number;
  submissionId?: string;
  status: SubmissionStatus | 'NOT_SUBMITTED';
  score?: number;
  isPassing?: boolean;
  submittedAt?: Date;
  gradedAt?: Date;
  feedback?: string;
  timeSpent?: number; // in minutes
}

export interface StudentAnalytics {
  studentId: string;
  coursesOverview: {
    enrolled: number;
    completed: number;
    inProgress: number;
    dropped: number;
    certificatesEarned: number;
  };
  learningStats: {
    totalTimeSpent: number; // in minutes
    averageSessionDuration: number; // in minutes
    totalLessonsCompleted: number;
    totalAssignmentsSubmitted: number;
    overallAverageScore: number;
    streakDays: number;
  };
  recentActivity: ActivityRecord[];
  performanceTrends: PerformanceTrend[];
}

export interface ActivityRecord {
  date: Date;
  courseId: string;
  courseTitle: string;
  activityType: 'LESSON_STARTED' | 'LESSON_COMPLETED' | 'ASSIGNMENT_SUBMITTED' | 'ASSIGNMENT_GRADED' | 'COURSE_COMPLETED';
  details: any;
  timeSpent?: number;
}

export interface PerformanceTrend {
  period: string; // YYYY-MM or YYYY-WW
  lessonsCompleted: number;
  assignmentsCompleted: number;
  averageScore: number;
  timeSpent: number;
}

export interface CourseAnalytics {
  courseId: string;
  studentsOverview: {
    totalEnrolled: number;
    activeStudents: number;
    completedStudents: number;
    droppedStudents: number;
    averageProgress: number;
  };
  engagement: {
    averageTimePerStudent: number;
    averageSessionDuration: number;
    completionRate: number;
    dropoutRate: number;
    mostEngagingLessons: string[];
    leastEngagingLessons: string[];
  };
  performance: {
    averageScore: number;
    passRate: number;
    difficultAssignments: string[];
    topPerformers: string[];
    strugglingStudents: string[];
  };
  trends: {
    enrollmentTrend: EnrollmentTrend[];
    progressTrend: ProgressTrend[];
    performanceTrend: PerformanceTrend[];
  };
}

export interface EnrollmentTrend {
  period: string;
  enrollments: number;
  completions: number;
  dropouts: number;
}

export interface ProgressTrend {
  period: string;
  averageProgress: number;
  activeStudents: number;
}

export interface LearningPathAnalytics {
  studentId: string;
  courseId: string;
  learningPath: {
    currentStep: number;
    totalSteps: number;
    estimatedTimeToComplete: number; // in minutes
    recommendedNextActions: string[];
    strugglingAreas: string[];
    strengths: string[];
  };
  adaptiveRecommendations: {
    recommendedLessons: string[];
    suggestedPracticeAreas: string[];
    difficultyAdjustments: DifficultyAdjustment[];
  };
}

export interface DifficultyAdjustment {
  contentId: string;
  contentType: 'LESSON' | 'ASSIGNMENT';
  currentDifficulty: string;
  recommendedDifficulty: string;
  reason: string;
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

  /**
   * Получение детальной аналитики прогресса студента по курсу
   */
  async getDetailedProgressAnalytics(studentId: string, courseId: string): Promise<DetailedProgressAnalytics> {
    this.logger.log(`Получение детальной аналитики для студента ${studentId} по курсу ${courseId}`);

    // Получаем основную информацию о прогрессе
    const [studentProgress, lessons, assignments, lessonProgress, assignmentSubmissions] = await Promise.all([
      this.prisma.studentProgress.findFirst({
        where: { studentId, courseId },
        include: { enrollment: true },
      }),
      this.prisma.lesson.findMany({
        where: { courseId, isPublished: true },
        select: { id: true, title: true, order: true, duration: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.assignment.findMany({
        where: { courseId, isPublished: true },
        select: { id: true, title: true, type: true, maxScore: true },
      }),
      this.prisma.lessonProgress.findMany({
        where: { studentId },
        include: {
          lesson: {
            select: { id: true, title: true, order: true, duration: true, courseId: true },
          },
        },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { studentId },
        include: {
          assignment: {
            select: { id: true, title: true, type: true, maxScore: true, courseId: true },
          },
        },
      }),
    ]);

    if (!studentProgress) {
      throw new NotFoundException('Студент не записан на этот курс');
    }

    // Фильтруем прогресс по урокам только для этого курса
    const courseLessonProgress = lessonProgress.filter(lp => lp.lesson.courseId === courseId);
    const courseAssignmentSubmissions = assignmentSubmissions.filter(as => as.assignment.courseId === courseId);

    // Анализируем уроки
    const lessonsAnalytics = this.analyzeLessonsProgress(lessons, courseLessonProgress);

    // Анализируем задания
    const assignmentsAnalytics = this.analyzeAssignmentsProgress(assignments, courseAssignmentSubmissions);

    // Анализируем производительность
    const performanceAnalytics = this.analyzePerformance(courseLessonProgress, courseAssignmentSubmissions);

    // Анализируем достижения
    const achievements = this.analyzeAchievements(studentProgress, courseLessonProgress, courseAssignmentSubmissions);

    return {
      courseId,
      studentId,
      overview: {
        enrolledAt: studentProgress.enrollment.enrolledAt,
        lastAccessedAt: studentProgress.lastAccessedAt,
        totalTimeSpent: studentProgress.totalTimeSpent,
        progressPercentage: Number(studentProgress.progressPercentage),
        status: studentProgress.status,
        certificateIssued: studentProgress.certificateIssued,
      },
      lessons: lessonsAnalytics,
      assignments: assignmentsAnalytics,
      performance: performanceAnalytics,
      achievements,
    };
  }

  /**
   * Получение аналитики студента по всем курсам
   */
  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    this.logger.log(`Получение общей аналитики студента ${studentId}`);

    const [enrollments, allLessonProgress, allSubmissions] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { studentId },
        include: {
          course: { select: { id: true, title: true } },
          progress: true,
        },
      }),
      this.prisma.lessonProgress.findMany({
        where: { studentId },
        include: {
          lesson: {
            select: { courseId: true, title: true },
            include: { course: { select: { title: true } } },
          },
        },
        orderBy: { lastAccessedAt: 'desc' },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { studentId },
        include: {
          assignment: {
            select: { courseId: true, title: true },
            include: { course: { select: { title: true } } },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    // Анализ курсов
    const coursesOverview = {
      enrolled: enrollments.length,
      completed: enrollments.filter(e => e.progress?.[0]?.status === 'COMPLETED').length,
      inProgress: enrollments.filter(e => e.progress?.[0]?.status === 'ACTIVE').length,
      dropped: enrollments.filter(e => e.progress?.[0]?.status === 'DROPPED').length,
      certificatesEarned: enrollments.filter(e => e.progress?.[0]?.certificateIssued).length,
    };

    // Статистика обучения
    const totalTimeSpent = enrollments.reduce((sum, e) => sum + (e.progress?.[0]?.totalTimeSpent || 0), 0);
    const totalLessonsCompleted = allLessonProgress.filter(lp => lp.completed).length;
    const totalAssignmentsSubmitted = allSubmissions.length;
    const averageScore = allSubmissions.length > 0
      ? allSubmissions.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / allSubmissions.length
      : 0;

    const learningStats = {
      totalTimeSpent,
      averageSessionDuration: totalLessonsCompleted > 0 ? totalTimeSpent / totalLessonsCompleted : 0,
      totalLessonsCompleted,
      totalAssignmentsSubmitted,
      overallAverageScore: averageScore,
      streakDays: this.calculateLearningStreak(allLessonProgress, allSubmissions),
    };

    // Недавняя активность
    const recentActivity = this.generateRecentActivity(allLessonProgress, allSubmissions);

    // Тренды производительности
    const performanceTrends = this.generatePerformanceTrends(allLessonProgress, allSubmissions);

    return {
      studentId,
      coursesOverview,
      learningStats,
      recentActivity,
      performanceTrends,
    };
  }

  /**
   * Получение аналитики курса
   */
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    this.logger.log(`Получение аналитики курса ${courseId}`);

    const [enrollments, lessonProgress, submissions] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        include: { progress: true },
      }),
      this.prisma.lessonProgress.findMany({
        where: { lesson: { courseId } },
        include: { lesson: { select: { id: true, title: true } } },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { assignment: { courseId } },
        include: { assignment: { select: { id: true, title: true } } },
      }),
    ]);

    // Обзор студентов
    const studentsOverview = {
      totalEnrolled: enrollments.length,
      activeStudents: enrollments.filter(e => e.progress?.[0]?.status === 'ACTIVE').length,
      completedStudents: enrollments.filter(e => e.progress?.[0]?.status === 'COMPLETED').length,
      droppedStudents: enrollments.filter(e => e.progress?.[0]?.status === 'DROPPED').length,
      averageProgress: enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + Number(e.progress?.[0]?.progressPercentage || 0), 0) / enrollments.length
        : 0,
    };

    // Вовлеченность
    const totalTimeSpent = enrollments.reduce((sum, e) => sum + (e.progress?.[0]?.totalTimeSpent || 0), 0);
    const completionRate = enrollments.length > 0 ? (studentsOverview.completedStudents / enrollments.length) * 100 : 0;
    const dropoutRate = enrollments.length > 0 ? (studentsOverview.droppedStudents / enrollments.length) * 100 : 0;

    const engagement = {
      averageTimePerStudent: enrollments.length > 0 ? totalTimeSpent / enrollments.length : 0,
      averageSessionDuration: lessonProgress.length > 0 ? totalTimeSpent / lessonProgress.length : 0,
      completionRate,
      dropoutRate,
      mostEngagingLessons: this.getMostEngagingLessons(lessonProgress),
      leastEngagingLessons: this.getLeastEngagingLessons(lessonProgress),
    };

    // Производительность
    const averageScore = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / submissions.length
      : 0;
    const passedSubmissions = submissions.filter(s => Number(s.score) >= 60).length; // isPassing doesn't exist
    const passRate = submissions.length > 0 ? (passedSubmissions / submissions.length) * 100 : 0;

    const performance = {
      averageScore,
      passRate,
      difficultAssignments: this.getDifficultAssignments(submissions),
      topPerformers: this.getTopPerformers(enrollments),
      strugglingStudents: this.getStrugglingStudents(enrollments),
    };

    // Тренды
    const trends = {
      enrollmentTrend: this.generateEnrollmentTrend(enrollments),
      progressTrend: this.generateProgressTrend(enrollments),
      performanceTrend: this.generatePerformanceTrend(submissions),
    };

    return {
      courseId,
      studentsOverview,
      engagement,
      performance,
      trends,
    };
  }

  /**
   * Получение адаптивного анализа обучающего пути
   */
  async getLearningPathAnalytics(studentId: string, courseId: string): Promise<LearningPathAnalytics> {
    this.logger.log(`Получение анализа обучающего пути для студента ${studentId} по курсу ${courseId}`);

    const [lessons, assignments, lessonProgress, submissions] = await Promise.all([
      this.prisma.lesson.findMany({
        where: { courseId, isPublished: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.assignment.findMany({
        where: { courseId, isPublished: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.lessonProgress.findMany({
        where: { studentId, lesson: { courseId } },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { studentId, assignment: { courseId } },
      }),
    ]);

    // Анализ текущего шага
    const completedLessons = lessonProgress.filter(lp => lp.completed).length;
    const completedAssignments = submissions.filter(s => s.status === SubmissionStatus.GRADED).length;
    const totalSteps = lessons.length + assignments.length;
    const currentStep = completedLessons + completedAssignments;

    // Оценка времени до завершения
    const averageTimePerLesson = lessonProgress.length > 0
      ? lessonProgress.reduce((sum, lp) => sum + lp.timeSpent, 0) / lessonProgress.length
      : 30; // default 30 minutes
    const remainingLessons = lessons.length - completedLessons;
    const remainingAssignments = assignments.length - completedAssignments;
    const estimatedTimeToComplete = (remainingLessons * averageTimePerLesson) + (remainingAssignments * 60); // 60 min per assignment

    // Анализ проблемных областей
    const strugglingAreas = this.identifyStrugglingAreas(lessonProgress, submissions);
    const strengths = this.identifyStrengths(lessonProgress, submissions);

    // Рекомендации
    const recommendedLessons = this.getRecommendedLessons(lessons, lessonProgress);
    const suggestedPracticeAreas = this.getSuggestedPracticeAreas(strugglingAreas);
    const difficultyAdjustments = this.getDifficultyAdjustments(lessonProgress, submissions);

    return {
      studentId,
      courseId,
      learningPath: {
        currentStep,
        totalSteps,
        estimatedTimeToComplete,
        recommendedNextActions: this.getRecommendedNextActions(lessons, assignments, lessonProgress, submissions),
        strugglingAreas,
        strengths,
      },
      adaptiveRecommendations: {
        recommendedLessons,
        suggestedPracticeAreas,
        difficultyAdjustments,
      },
    };
  }

  /**
   * Обновление прогресса по заданию (интеграция с Assignment System)
   */
  async updateAssignmentProgress(
    studentId: string,
    courseId: string,
    assignmentId: string,
    submissionData: {
      score?: number;
      timeSpent?: number;
      completed: boolean;
    }
  ): Promise<ProgressSummary> {
    this.logger.log(`Обновление прогресса по заданию ${assignmentId} для студента ${studentId}`);

    // Проверяем запись на курс
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, courseId, status: 'ACTIVE' },
    });

    if (!enrollment) {
      throw new NotFoundException('Студент не записан на этот курс');
    }

    // Обновляем общий прогресс с учетом заданий
    return await this.recalculateProgressWithAssignments(studentId, courseId);
  }

  /**
   * Пересчет прогресса с учетом заданий
   */
  private async recalculateProgressWithAssignments(
    studentId: string,
    courseId: string
  ): Promise<ProgressSummary> {
    const [lessonProgress, assignmentSubmissions, totalLessons, totalAssignments, enrollment] = await this.prisma.$transaction([
      this.prisma.lessonProgress.findMany({
        where: { studentId, lesson: { courseId } },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { studentId, assignment: { courseId } },
      }),
      this.prisma.lesson.count({
        where: { courseId, isPublished: true },
      }),
      this.prisma.assignment.count({
        where: { courseId, isPublished: true },
      }),
      this.prisma.enrollment.findFirst({
        where: { studentId, courseId, status: 'ACTIVE' },
      }),
    ]);

    const completedLessons = lessonProgress.filter(lp => lp.completed).length;
    const completedAssignments = assignmentSubmissions.filter(
      as => as.status === SubmissionStatus.GRADED
    ).length;

    const totalTimeSpent = lessonProgress.reduce((sum, lp) => sum + lp.timeSpent, 0) +
      assignmentSubmissions.reduce((sum, as) => sum + 0, 0); // timeSpent doesn't exist

    // Weighted progress: 70% lessons, 30% assignments
    const lessonWeight = 0.7;
    const assignmentWeight = 0.3;
    
    const lessonProgressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 100;
    const assignmentProgress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 100;
    
    const progressPercentage = Math.round(
      (lessonProgressPercent * lessonWeight) + (assignmentProgress * assignmentWeight)
    );

    // Определяем статус
    let status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DROPPED' = 'ACTIVE';
    
    if (progressPercentage >= 100) {
      status = 'COMPLETED';
    } else if (progressPercentage === 0) {
      status = 'ACTIVE';
    } else {
      // Проверяем активность за последние 30 дней
      const recentActivity = [...lessonProgress, ...assignmentSubmissions]
        .filter(item => 'lastAccessedAt' in item ? item.lastAccessedAt : item.submittedAt)
        .sort((a, b) => {
          const dateA = 'lastAccessedAt' in a ? a.lastAccessedAt : a.submittedAt;
          const dateB = 'lastAccessedAt' in b ? b.lastAccessedAt : b.submittedAt;
          return dateB?.getTime() - dateA?.getTime();
        })[0];
      
      if (recentActivity) {
        const lastActivityDate = 'lastAccessedAt' in recentActivity 
          ? recentActivity.lastAccessedAt 
          : recentActivity.submittedAt;
        
        if (lastActivityDate) {
          const daysSinceLastActivity = Math.floor(
            (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastActivity > 30) {
            status = 'PAUSED';
          }
        }
      }
    }

    // Обновляем прогресс
    const updatedProgress = await this.prisma.studentProgress.upsert({
      where: {
        userId_courseId: { studentId, courseId },
      },
      update: {
        completedLessons,
        totalLessons,
        completedAssignments,
        totalAssignments,
        progressPercentage,
        status,
        totalTimeSpent,
        lastAccessedAt: new Date(),
      },
      create: {
        studentId,
        courseId,
        enrollmentId: enrollment.id,
        completedLessons,
        totalLessons,
        completedAssignments,
        totalAssignments,
        progressPercentage,
        status,
        totalTimeSpent,
        certificateIssued: false,
      },
      include: { enrollment: true },
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

  // Вспомогательные методы для анализа данных
  private analyzeLessonsProgress(lessons: any[], lessonProgress: any[]) {
    const completed = lessonProgress.filter(lp => lp.completed).length;
    const inProgress = lessonProgress.filter(lp => !lp.completed && lp.timeSpent > 0).length;
    const notStarted = lessons.length - lessonProgress.length;
    const averageWatchTime = lessonProgress.length > 0
      ? lessonProgress.reduce((sum, lp) => sum + lp.watchTime, 0) / lessonProgress.length
      : 0;

    const progressDetails: LessonProgressDetail[] = lessons.map(lesson => {
      const progress = lessonProgress.find(lp => lp.lessonId === lesson.id);
      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        order: lesson.order,
        status: progress?.status || LessonStatus.NOT_STARTED,
        progressPercentage: progress ? Number(progress.progressPercentage) : 0,
        completed: progress?.completed || false,
        timeSpent: progress?.timeSpent || 0,
        watchTime: progress?.watchTime || 0,
        startedAt: progress?.startedAt,
        completedAt: progress?.completedAt,
        lastAccessedAt: progress?.lastAccessedAt,
        score: progress?.score ? Number(progress.score) : undefined,
      };
    });

    return {
      total: lessons.length,
      completed,
      inProgress,
      notStarted,
      averageWatchTime,
      progressDetails,
    };
  }

  private analyzeAssignmentsProgress(assignments: any[], submissions: any[]) {
    const submitted = submissions.length;
    const graded = submissions.filter(s => s.status === SubmissionStatus.GRADED).length;
    const pending = submissions.filter(s => s.status === SubmissionStatus.SUBMITTED).length;
    const averageScore = graded > 0
      ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / graded
      : 0;
    const passedCount = submissions.filter(s => s.isPassing).length;

    const assignmentDetails: AssignmentProgressDetail[] = assignments.map(assignment => {
      const submission = submissions.find(s => s.assignmentId === assignment.id);
      return {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        assignmentType: assignment.type,
        maxScore: assignment.maxScore,
        submissionId: submission?.id,
        status: submission?.status || 'NOT_SUBMITTED',
        score: submission?.score,
        isPassing: submission?.isPassing,
        submittedAt: submission?.submittedAt,
        gradedAt: submission?.gradedAt,
        feedback: submission?.feedback,
        timeSpent: submission?.timeSpent,
      };
    });

    return {
      total: assignments.length,
      submitted,
      graded,
      pending,
      averageScore,
      passedCount,
      assignmentDetails,
    };
  }

  private analyzePerformance(lessonProgress: any[], submissions: any[]) {
    const lessonScores = lessonProgress.filter(lp => lp.score).map(lp => Number(lp.score));
    const submissionScores = submissions.filter(s => s.score).map(s => Number(s.score));
    const allScores = [...lessonScores, ...submissionScores];
    
    const overallScore = allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
      : 0;

    // Рассчитываем streaks
    const streaks = this.calculateStreaks(lessonProgress, submissions);

    // Рассчитываем скорость обучения (lessons/assignments per week)
    const learningVelocity = this.calculateLearningVelocity(lessonProgress, submissions);

    // Анализ временного распределения
    const timeDistribution = this.analyzeTimeDistribution(lessonProgress, submissions);

    return {
      overallScore,
      streaks,
      learningVelocity,
      timeDistribution,
    };
  }

  private analyzeAchievements(studentProgress: any, lessonProgress: any[], submissions: any[]) {
    const milestones: string[] = [];
    const badges: string[] = [];
    const certificates: string[] = [];

    // Проверяем милestones
    if (studentProgress.progressPercentage >= 25) milestones.push('25% Completed');
    if (studentProgress.progressPercentage >= 50) milestones.push('50% Completed');
    if (studentProgress.progressPercentage >= 75) milestones.push('75% Completed');
    if (studentProgress.progressPercentage >= 100) milestones.push('Course Completed');

    // Проверяем badges
    if (lessonProgress.filter(lp => lp.completed).length >= 5) badges.push('Lesson Explorer');
    if (submissions.filter(s => s.score >= 90).length >= 3) badges.push('High Achiever');
    if (studentProgress.totalTimeSpent >= 600) badges.push('Dedicated Learner'); // 10 hours

    // Проверяем certificates
    if (studentProgress.certificateIssued) certificates.push('Course Certificate');

    return {
      milestones,
      badges,
      certificates,
    };
  }

  // Дополнительные вспомогательные методы
  private calculateLearningStreak(lessonProgress: any[], submissions: any[]): number {
    // Логика подсчета текущего streak
    return 7; // Заглушка
  }

  private generateRecentActivity(lessonProgress: any[], submissions: any[]): ActivityRecord[] {
    // Логика генерации недавней активности
    return []; // Заглушка
  }

  private generatePerformanceTrends(lessonProgress: any[], submissions: any[]): PerformanceTrend[] {
    // Логика генерации трендов производительности
    return []; // Заглушка
  }

  private getMostEngagingLessons(lessonProgress: any[]): string[] {
    // Логика определения самых привлекательных уроков
    return [];
  }

  private getLeastEngagingLessons(lessonProgress: any[]): string[] {
    // Логика определения наименее привлекательных уроков
    return [];
  }

  private getDifficultAssignments(submissions: any[]): string[] {
    // Логика определения сложных заданий
    return [];
  }

  private getTopPerformers(enrollments: any[]): string[] {
    // Логика определения лучших студентов
    return [];
  }

  private getStrugglingStudents(enrollments: any[]): string[] {
    // Логика определения студентов, испытывающих трудности
    return [];
  }

  private generateEnrollmentTrend(enrollments: any[]): EnrollmentTrend[] {
    // Логика генерации трендов записи
    return [];
  }

  private generateProgressTrend(enrollments: any[]): ProgressTrend[] {
    // Логика генерации трендов прогресса
    return [];
  }

  private generatePerformanceTrend(submissions: any[]): PerformanceTrend[] {
    // Логика генерации трендов производительности
    return [];
  }

  private calculateStreaks(lessonProgress: any[], submissions: any[]) {
    // Логика подсчета streaks
    return { current: 3, longest: 7 };
  }

  private calculateLearningVelocity(lessonProgress: any[], submissions: any[]): number {
    // Логика подсчета скорости обучения
    return 2.5; // уроков/заданий в неделю
  }

  private analyzeTimeDistribution(lessonProgress: any[], submissions: any[]) {
    // Логика анализа временного распределения
    return {
      weekdays: 70,
      weekends: 30,
      mornings: 25,
      afternoons: 45,
      evenings: 30,
    };
  }

  private identifyStrugglingAreas(lessonProgress: any[], submissions: any[]): string[] {
    // Логика определения проблемных областей
    return ['Advanced JavaScript', 'React Hooks'];
  }

  private identifyStrengths(lessonProgress: any[], submissions: any[]): string[] {
    // Логика определения сильных сторон
    return ['HTML/CSS', 'Basic Programming'];
  }

  private getRecommendedLessons(lessons: any[], lessonProgress: any[]): string[] {
    // Логика рекомендации уроков
    return [];
  }

  private getSuggestedPracticeAreas(strugglingAreas: string[]): string[] {
    // Логика предложения областей для практики
    return strugglingAreas;
  }

  private getDifficultyAdjustments(lessonProgress: any[], submissions: any[]): DifficultyAdjustment[] {
    // Логика предложения изменения сложности
    return [];
  }

  private getRecommendedNextActions(
    lessons: any[], 
    assignments: any[], 
    lessonProgress: any[], 
    submissions: any[]
  ): string[] {
    const actions: string[] = [];
    
    // Проверяем незавершенные уроки
    const incompleteLessons = lessons.filter(lesson => 
      !lessonProgress.some(lp => lp.lessonId === lesson.id && lp.completed)
    );
    
    if (incompleteLessons.length > 0) {
      actions.push(`Продолжить урок: ${incompleteLessons[0].title}`);
    }

    // Проверяем несданные задания
    const unsubmittedAssignments = assignments.filter(assignment =>
      !submissions.some(s => s.assignmentId === assignment.id)
    );
    
    if (unsubmittedAssignments.length > 0) {
      actions.push(`Выполнить задание: ${unsubmittedAssignments[0].title}`);
    }

    return actions;
  }
}