import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Assignment, AssignmentSubmission } from '@prisma/client';

@Injectable()
export class AssignmentEventListener {
  private readonly logger = new Logger(AssignmentEventListener.name);
  private readonly notificationServiceUrl: string;
  private readonly analyticsServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.notificationServiceUrl = this.configService.get('NOTIFICATION_SERVICE_URL', 'http://notification-service:3006');
    this.analyticsServiceUrl = this.configService.get('ANALYTICS_SERVICE_URL', 'http://analytics-service:3007');
  }

  /**
   * Обработка создания задания
   */
  @OnEvent('assignment.created')
  async handleAssignmentCreated(payload: {
    assignment: Assignment;
    creatorId: string;
  }) {
    this.logger.log(`Обработка события: создание задания ${payload.assignment.id}`);

    try {
      // Отправляем аналитическое событие
      await this.trackAnalyticsEvent({
        eventName: 'assignment_created',
        category: 'ASSIGNMENT',
        action: 'create',
        userId: payload.creatorId,
        courseId: payload.assignment.courseId,
        assignmentId: payload.assignment.id,
        metadata: {
          type: payload.assignment.type,
          maxScore: payload.assignment.maxScore,
          hasDeadline: !!payload.assignment.dueDate,
        },
      });

      this.logger.debug('✅ Событие создания задания обработано');
    } catch (error) {
      this.logger.error('❌ Ошибка обработки создания задания:', error);
    }
  }

  /**
   * Обработка обновления задания
   */
  @OnEvent('assignment.updated')
  async handleAssignmentUpdated(payload: {
    assignment: Assignment;
    updaterId: string;
  }) {
    this.logger.log(`Обработка события: обновление задания ${payload.assignment.id}`);

    try {
      // Отправляем аналитическое событие
      await this.trackAnalyticsEvent({
        eventName: 'assignment_updated',
        category: 'ASSIGNMENT',
        action: 'update',
        userId: payload.updaterId,
        courseId: payload.assignment.courseId,
        assignmentId: payload.assignment.id,
        metadata: {
          isPublished: payload.assignment.isPublished,
        },
      });

      this.logger.debug('✅ Событие обновления задания обработано');
    } catch (error) {
      this.logger.error('❌ Ошибка обработки обновления задания:', error);
    }
  }

  /**
   * Обработка удаления задания
   */
  @OnEvent('assignment.deleted')
  async handleAssignmentDeleted(payload: {
    assignmentId: string;
    courseId: string;
    deleterId: string;
  }) {
    this.logger.log(`Обработка события: удаление задания ${payload.assignmentId}`);

    try {
      // Отправляем аналитическое событие
      await this.trackAnalyticsEvent({
        eventName: 'assignment_deleted',
        category: 'ASSIGNMENT',
        action: 'delete',
        userId: payload.deleterId,
        courseId: payload.courseId,
        assignmentId: payload.assignmentId,
      });

      this.logger.debug('✅ Событие удаления задания обработано');
    } catch (error) {
      this.logger.error('❌ Ошибка обработки удаления задания:', error);
    }
  }

  /**
   * Обработка публикации задания
   */
  @OnEvent('assignment.published')
  async handleAssignmentPublished(payload: {
    assignment: Assignment;
    publisherId: string;
  }) {
    this.logger.log(`Обработка события: публикация задания ${payload.assignment.id}`);

    try {
      // Отправляем уведомления студентам курса
      await this.sendNotificationToStudents({
        courseId: payload.assignment.courseId,
        type: 'assignment_published',
        title: 'Новое задание',
        message: `Опубликовано новое задание: ${payload.assignment.title}`,
        data: {
          assignmentId: payload.assignment.id,
          assignmentTitle: payload.assignment.title,
          dueDate: payload.assignment.dueDate,
          maxScore: payload.assignment.maxScore,
        },
      });

      // Отправляем аналитическое событие
      await this.trackAnalyticsEvent({
        eventName: 'assignment_published',
        category: 'ASSIGNMENT',
        action: 'publish',
        userId: payload.publisherId,
        courseId: payload.assignment.courseId,
        assignmentId: payload.assignment.id,
        metadata: {
          type: payload.assignment.type,
          maxScore: payload.assignment.maxScore,
        },
      });

      this.logger.debug('✅ Событие публикации задания обработано');
    } catch (error) {
      this.logger.error('❌ Ошибка обработки публикации задания:', error);
    }
  }

  /**
   * Обработка создания подачи
   */
  @OnEvent('submission.created')
  async handleSubmissionCreated(payload: {
    submission: AssignmentSubmission;
    assignment: Assignment;
    studentId: string;
  }) {
    this.logger.log(`Обработка события: создание подачи ${payload.submission.id}`);

    try {
      // Отправляем уведомление преподавателю
      await this.sendNotificationToInstructor({
        courseId: payload.assignment.courseId,
        type: 'submission_received',
        title: 'Получена новая подача',
        message: `Студент подал работу по заданию: ${payload.assignment.title}`,
        data: {
          submissionId: payload.submission.id,
          assignmentId: payload.assignment.id,
          assignmentTitle: payload.assignment.title,
          studentId: payload.studentId,
          attemptNumber: payload.submission.attemptNumber,
        },
      });

      // Отправляем аналитическое событие
      await this.trackAnalyticsEvent({
        eventName: 'submission_created',
        category: 'SUBMISSION',
        action: 'submit',
        userId: payload.studentId,
        courseId: payload.assignment.courseId,
        assignmentId: payload.assignment.id,
        submissionId: payload.submission.id,
        metadata: {
          attemptNumber: payload.submission.attemptNumber,
          isOnTime: payload.assignment.dueDate ? 
            payload.submission.submittedAt <= payload.assignment.dueDate : true,
          type: payload.assignment.type,
        },
      });

      this.logger.debug('✅ Событие создания подачи обработано');
    } catch (error) {
      this.logger.error('❌ Ошибка обработки создания подачи:', error);
    }
  }

  /**
   * Обработка обновления подачи
   */
  @OnEvent('submission.updated')
  async handleSubmissionUpdated(payload: {
    submission: AssignmentSubmission;
    studentId: string;
  }) {
    this.logger.log(`Обработка события: обновление подачи ${payload.submission.id}`);

    try {
      // Отправляем аналитическое событие
      await this.trackAnalyticsEvent({
        eventName: 'submission_updated',
        category: 'SUBMISSION',
        action: 'update',
        userId: payload.studentId,
        submissionId: payload.submission.id,
        assignmentId: payload.submission.assignmentId,
        metadata: {
          attemptNumber: payload.submission.attemptNumber,
        },
      });

      this.logger.debug('✅ Событие обновления подачи обработано');
    } catch (error) {
      this.logger.error('❌ Ошибка обработки обновления подачи:', error);
    }
  }

  /**
   * Обработка оценивания подачи
   */
  @OnEvent('submission.graded')
  async handleSubmissionGraded(payload: {
    submission: AssignmentSubmission;
    assignment: Assignment;
    graderId: string;
  }) {
    this.logger.log(`Обработка события: оценивание подачи ${payload.submission.id}`);

    try {
      // Отправляем уведомление студенту
      await this.sendNotificationToStudent({
        studentId: payload.submission.studentId,
        type: 'submission_graded',
        title: 'Работа проверена',
        message: `Ваша работа по заданию "${payload.assignment.title}" проверена. Оценка: ${payload.submission.score}/${payload.submission.maxScore}`,
        data: {
          submissionId: payload.submission.id,
          assignmentId: payload.assignment.id,
          assignmentTitle: payload.assignment.title,
          score: Number(payload.submission.score),
          maxScore: payload.submission.maxScore,
          feedback: payload.submission.feedback,
          isPassing: Number(payload.submission.score) >= payload.assignment.passingScore,
        },
      });

      // Отправляем аналитическое событие
      await this.trackAnalyticsEvent({
        eventName: 'submission_graded',
        category: 'SUBMISSION',
        action: 'grade',
        userId: payload.graderId,
        courseId: payload.assignment.courseId,
        assignmentId: payload.assignment.id,
        submissionId: payload.submission.id,
        metadata: {
          score: Number(payload.submission.score),
          maxScore: payload.submission.maxScore,
          percentage: Math.round((Number(payload.submission.score) / payload.submission.maxScore) * 100),
          isPassing: Number(payload.submission.score) >= payload.assignment.passingScore,
          isAutoGraded: payload.submission.gradedBy === 'system',
          gradedBy: payload.submission.gradedBy,
        },
      });

      this.logger.debug('✅ Событие оценивания подачи обработано');
    } catch (error) {
      this.logger.error('❌ Ошибка обработки оценивания подачи:', error);
    }
  }

  /**
   * Обработка назначения peer review
   */
  @OnEvent('peer.reviews.assigned')
  async handlePeerReviewsAssigned(payload: {
    assignmentId: string;
    assignments: Array<{
      revieweeSubmissionId: string;
      reviewerStudentId: string;
      dueDate?: Date;
      criteria: string[];
    }>;
  }) {
    this.logger.log(`Обработка события: назначение peer review для задания ${payload.assignmentId}`);

    try {
      // Отправляем уведомления студентам-рецензентам
      for (const assignment of payload.assignments) {
        await this.sendNotificationToStudent({
          studentId: assignment.reviewerStudentId,
          type: 'peer_review_assigned',
          title: 'Назначена взаимная проверка',
          message: 'Вам назначена работа для взаимной проверки',
          data: {
            assignmentId: payload.assignmentId,
            submissionId: assignment.revieweeSubmissionId,
            dueDate: assignment.dueDate,
            criteria: assignment.criteria,
          },
        });
      }

      // Отправляем аналитическое событие
      await this.trackAnalyticsEvent({
        eventName: 'peer_reviews_assigned',
        category: 'PEER_REVIEW',
        action: 'assign',
        assignmentId: payload.assignmentId,
        metadata: {
          assignmentsCount: payload.assignments.length,
        },
      });

      this.logger.debug('✅ Событие назначения peer review обработано');
    } catch (error) {
      this.logger.error('❌ Ошибка обработки назначения peer review:', error);
    }
  }

  // Приватные методы для интеграции с другими сервисами

  private async trackAnalyticsEvent(eventData: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.analyticsServiceUrl}/api/events`, eventData, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    } catch (error) {
      this.logger.warn('Не удалось отправить аналитическое событие:', error.message);
    }
  }

  private async sendNotificationToStudents(notificationData: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/api/notifications/course-students`, notificationData, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    } catch (error) {
      this.logger.warn('Не удалось отправить уведомление студентам:', error.message);
    }
  }

  private async sendNotificationToInstructor(notificationData: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/api/notifications/course-instructor`, notificationData, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    } catch (error) {
      this.logger.warn('Не удалось отправить уведомление преподавателю:', error.message);
    }
  }

  private async sendNotificationToStudent(notificationData: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/api/notifications/student`, notificationData, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    } catch (error) {
      this.logger.warn('Не удалось отправить уведомление студенту:', error.message);
    }
  }
}
