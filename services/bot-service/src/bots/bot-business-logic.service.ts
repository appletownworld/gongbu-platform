import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { MessageTemplatesService } from './message-templates.service';
import { BotConfig } from './bot-instance-manager.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BotBusinessLogic {
  private readonly logger = new Logger(BotBusinessLogic.name);

  constructor(
    private prisma: PrismaService,
    private messageTemplates: MessageTemplatesService,
    private httpService: HttpService,
  ) {}

  async handleStart(ctx: Context, config: BotConfig, startParam?: string) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) return;

    this.logger.log(`Handling /start for user ${telegramUserId}`);

    try {
      // Получение или создание пользователя бота
      let botUser = await this.getBotUser(config.id, BigInt(telegramUserId));
      if (!botUser) {
        botUser = await this.createBotUser(config.id, ctx.from);
      }

      // Получение курса
      const course = await this.getCourse(config.courseId);
      if (!course) {
        await ctx.reply('Курс не найден. Обратитесь к администратору.');
        return;
      }

      // Получение прогресса пользователя
      const progress = await this.getUserProgress(botUser.platformUserId, course.id);

      // Отправка приветственного сообщения
      const welcomeMessage = this.messageTemplates.welcome(course, botUser, config);
      const keyboard = this.createStartKeyboard(course, progress);

      await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });

      // Обработка deep link параметра
      if (startParam) {
        await this.handleDeepLink(ctx, config, startParam);
      }
    } catch (error) {
      this.logger.error(`Error in handleStart: ${error.message}`);
      await ctx.reply(this.messageTemplates.errorMessage());
    }
  }

  async handleProgress(ctx: Context, config: BotConfig) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) return;

    try {
      const botUser = await this.getBotUser(config.id, BigInt(telegramUserId));
      if (!botUser) {
        await ctx.reply('Сначала используйте /start для начала обучения.');
        return;
      }

      const course = await this.getCourse(config.courseId);
      const progress = await this.getUserProgress(botUser.platformUserId, config.courseId);

      const progressMessage = this.messageTemplates.progress(course, progress, botUser);
      await ctx.reply(progressMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      this.logger.error(`Error in handleProgress: ${error.message}`);
      await ctx.reply(this.messageTemplates.errorMessage());
    }
  }

  async handleCourses(ctx: Context, config: BotConfig) {
    try {
      const coursesMessage = this.messageTemplates.coursesMenu();
      const keyboard = this.messageTemplates.coursesKeyboard();

      await ctx.reply(coursesMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      this.logger.error(`Error in handleCourses: ${error.message}`);
      await ctx.reply(this.messageTemplates.errorMessage());
    }
  }

  async handleStepNavigation(ctx: Context, config: BotConfig, stepId: string) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) return;

    try {
      const botUser = await this.getBotUser(config.id, BigInt(telegramUserId));
      if (!botUser?.platformUserId) {
        await ctx.reply('Необходимо зарегистрироваться в системе.');
        return;
      }

      // Получение урока/этапа
      const step = await this.getLesson(stepId);
      if (!step) {
        await ctx.reply('Урок не найден.');
        return;
      }

      // Проверка доступа к уроку
      const hasAccess = await this.checkLessonAccess(botUser.platformUserId, step);
      if (!hasAccess) {
        await ctx.reply('Урок недоступен. Завершите предыдущие уроки.');
        return;
      }

      // Обновление состояния пользователя
      await this.updateBotUserState(botUser.id, { currentStepId: stepId });

      // Отправка контента урока
      await this.sendStepContent(ctx, step, config);
    } catch (error) {
      this.logger.error(`Error in handleStepNavigation: ${error.message}`);
      await ctx.reply(this.messageTemplates.errorMessage());
    }
  }

  async handleQuizAnswer(
    ctx: Context,
    config: BotConfig,
    stepId: string,
    questionIndex: number,
    answerIndex: string,
  ) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) return;

    try {
      const botUser = await this.getBotUser(config.id, BigInt(telegramUserId));
      if (!botUser?.platformUserId) return;

      // Получение урока с квизом
      const step = await this.getLesson(stepId);
      const question = (step?.content as any)?.questions?.[questionIndex];
      
      if (!question) {
        await ctx.reply('Вопрос не найден.');
        return;
      }

      const isCorrect = question.correctAnswer === parseInt(answerIndex);

      // Сохранение ответа
      await this.saveQuizAnswer(
        botUser.platformUserId,
        stepId,
        questionIndex,
        answerIndex,
        isCorrect,
      );

      // Обратная связь
      if (isCorrect) {
        await ctx.reply('✅ Правильно!');
      } else {
        await ctx.reply('❌ Неправильно. Попробуйте еще раз.');
      }

      // Показ объяснения
      if (question.explanation) {
        await ctx.reply(`💡 ${question.explanation}`, { parse_mode: 'Markdown' });
      }

      // Переход к следующему вопросу или завершение квиза
      if (questionIndex + 1 < (step.content as any).questions?.length) {
        await this.sendQuizQuestion(ctx, step, questionIndex + 1);
      } else {
        await this.completeQuizStep(ctx, botUser.platformUserId, stepId);
      }
    } catch (error) {
      this.logger.error(`Error in handleQuizAnswer: ${error.message}`);
      await ctx.reply(this.messageTemplates.errorMessage());
    }
  }

  async handleTextMessage(ctx: Context, config: BotConfig) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId || !('text' in ctx.message!)) return;

    try {
      const botUser = await this.getBotUser(config.id, BigInt(telegramUserId));
      if (!botUser?.currentStepId) {
        await ctx.reply('Используйте /start для начала обучения или кнопки для навигации.');
        return;
      }

      // Получение текущего урока
      const step = await this.getLesson(botUser.currentStepId);
      
      if (step?.contentType === 'ASSIGNMENT') {
        await this.handleAssignmentSubmission(ctx, botUser, step, {
          type: 'text',
          content: ctx.message.text,
        });
      } else {
        await ctx.reply(
          'Сейчас ввод текста не требуется. Используйте кнопки для навигации.',
        );
      }
    } catch (error) {
      this.logger.error(`Error in handleTextMessage: ${error.message}`);
      await ctx.reply(this.messageTemplates.errorMessage());
    }
  }

  async handlePhotoMessage(ctx: Context, config: BotConfig) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) return;

    try {
      const botUser = await this.getBotUser(config.id, BigInt(telegramUserId));
      if (!botUser?.currentStepId) return;

      const step = await this.getLesson(botUser.currentStepId);
      
      if (step?.contentType === 'ASSIGNMENT') {
        await this.handleAssignmentSubmission(ctx, botUser, step, {
          type: 'photo',
          fileId: 'photo' in ctx.message! ? ctx.message.photo![0].file_id : '',
        });
      }
    } catch (error) {
      this.logger.error(`Error in handlePhotoMessage: ${error.message}`);
    }
  }

  async handleDocumentMessage(ctx: Context, config: BotConfig) {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) return;

    try {
      const botUser = await this.getBotUser(config.id, BigInt(telegramUserId));
      if (!botUser?.currentStepId) return;

      const step = await this.getLesson(botUser.currentStepId);
      
      if (step?.contentType === 'ASSIGNMENT') {
        await this.handleAssignmentSubmission(ctx, botUser, step, {
          type: 'document',
          fileId: 'document' in ctx.message! ? ctx.message.document!.file_id : '',
        });
      }
    } catch (error) {
      this.logger.error(`Error in handleDocumentMessage: ${error.message}`);
    }
  }

  async handleNextStep(ctx: Context, config: BotConfig) {
    // Получение следующего урока и навигация
    await ctx.reply('Переход к следующему уроку...');
  }

  async handlePrevStep(ctx: Context, config: BotConfig) {
    // Получение предыдущего урока и навигация  
    await ctx.reply('Переход к предыдущему уроку...');
  }

  async handleCourseMenu(ctx: Context, config: BotConfig) {
    try {
      const course = await this.getCourse(config.courseId);
      const botUser = await this.getBotUser(config.id, BigInt(ctx.from?.id || 0));
      const progress = await this.getUserProgress(botUser?.platformUserId, config.courseId);

      const menuText = `📚 *Меню курса "${course?.title}"*

Выберите действие:`;

      const keyboard = this.messageTemplates.courseMenu(course, progress);

      await ctx.reply(menuText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      this.logger.error(`Error in handleCourseMenu: ${error.message}`);
      await ctx.reply(this.messageTemplates.errorMessage());
    }
  }

  async handleWebAppData(ctx: Context, config: BotConfig) {
    // Обработка данных из WebApp
    if ('web_app_data' in ctx.message!) {
      const data = JSON.parse(ctx.message.web_app_data!.data);
      await ctx.reply(`Получены данные из WebApp: ${JSON.stringify(data)}`);
    }
  }

  // Приватные методы
  private async getBotUser(botId: string, telegramId: bigint) {
    return this.prisma.botUsers.findFirst({
      where: { botId, telegramId },
    });
  }

  private async createBotUser(botId: string, telegramUser: any) {
    return this.prisma.botUsers.create({
      data: {
        botId,
        telegramId: BigInt(telegramUser.id),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code || 'ru',
        platformUserId: `telegram_${telegramUser.id}`, // Временно
      },
    });
  }

  private async getCourse(courseId: string) {
    // Заглушка - в реальности запрос к Course Service
    try {
      const response = await firstValueFrom(
        this.httpService.get(`http://localhost:3002/courses/slug/${courseId}`),
      );
      return response.data;
    } catch {
      return {
        id: courseId,
        title: 'Python для начинающих',
        description: 'Изучите основы программирования на Python',
        lessonCount: 3,
        estimatedDuration: 120,
        slug: 'python-for-beginners',
      };
    }
  }

  private async getLesson(lessonId: string) {
    // Заглушка - в реальности запрос к Course Service
    return {
      id: lessonId,
      title: 'Урок 1: Основы',
      content: { text: 'Содержимое урока...' },
      contentType: 'TEXT',
      order: 1,
    };
  }

  private async getUserProgress(userId?: string, courseId?: string) {
    // Заглушка - в реальности запрос к Progress Service
    return {
      completedLessons: 1,
      totalLessons: 3,
      currentLessonId: 'lesson-1',
      timeSpent: 45,
      averageScore: 85,
    };
  }

  private async checkLessonAccess(userId: string, lesson: any): Promise<boolean> {
    // В реальности - проверка через Course Service
    return true;
  }

  private async updateBotUserState(userId: string, state: any) {
    return this.prisma.botUsers.update({
      where: { id: userId },
      data: { botState: state },
    });
  }

  private async sendStepContent(ctx: Context, step: any, config: BotConfig) {
    const progress = { completedLessons: 1, totalLessons: 3 };
    
    switch (step.contentType) {
      case 'TEXT':
        await this.sendTextStep(ctx, step, progress);
        break;
      case 'VIDEO':
        await this.sendVideoStep(ctx, step, progress);
        break;
      case 'QUIZ':
        await this.sendQuizStep(ctx, step);
        break;
      case 'ASSIGNMENT':
        await this.sendAssignmentStep(ctx, step);
        break;
    }
  }

  private async sendTextStep(ctx: Context, step: any, progress: any) {
    const message = this.messageTemplates.stepContent(step, progress);
    const keyboard = this.messageTemplates.navigationKeyboard(step, true, false);

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  private async sendVideoStep(ctx: Context, step: any, progress: any) {
    if (step.content?.videoUrl) {
      await ctx.reply(`🎥 ${step.title}\n\n${step.content.videoUrl}`);
    }
    
    await this.sendTextStep(ctx, step, progress);
  }

  private async sendQuizStep(ctx: Context, step: any) {
    await this.sendQuizQuestion(ctx, step, 0);
  }

  private async sendQuizQuestion(ctx: Context, step: any, questionIndex: number) {
    const question = step.content?.questions?.[questionIndex];
    if (!question) return;

    const questionText = this.messageTemplates.quiz(step, questionIndex);
    const keyboard = this.messageTemplates.quizOptions(question, step.id, questionIndex);

    await ctx.reply(questionText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  private async sendAssignmentStep(ctx: Context, step: any) {
    const assignmentText = this.messageTemplates.assignment(step);
    await ctx.reply(assignmentText, { parse_mode: 'Markdown' });
  }

  private createStartKeyboard(course: any, progress: any) {
    return {
      inline_keyboard: [
        [
          {
            text: '🚀 Начать обучение',
            callback_data: `step_${progress.currentLessonId || 'lesson-1'}`,
          },
        ],
        [
          {
            text: '🌐 Открыть в WebApp',
            web_app: { url: `http://localhost:3000/student/${course.slug || course.id}` },
          },
        ],
        [
          { text: '📊 Мой прогресс', callback_data: 'show_progress' },
          { text: '❓ Помощь', callback_data: 'help' },
        ],
      ],
    };
  }

  private async handleDeepLink(ctx: Context, config: BotConfig, param: string) {
    // Обработка deep link параметров
    if (param.startsWith('lesson_')) {
      const lessonId = param.replace('lesson_', '');
      await this.handleStepNavigation(ctx, config, lessonId);
    }
  }

  private async saveQuizAnswer(
    userId: string,
    stepId: string,
    questionIndex: number,
    answer: string,
    isCorrect: boolean,
  ) {
    // В реальности - запрос к Progress Service
    this.logger.log(`Quiz answer saved: ${userId}, ${stepId}, ${questionIndex}, ${isCorrect}`);
  }

  private async completeQuizStep(ctx: Context, userId: string, stepId: string) {
    await ctx.reply('✅ Квиз завершен! Переходим к следующему уроку.');
  }

  private async handleAssignmentSubmission(
    ctx: Context,
    botUser: any,
    step: any,
    submission: any,
  ) {
    await ctx.reply('📝 Задание принято! Ожидайте проверки преподавателя.');
    
    // В реальности - сохранение в Progress Service
    this.logger.log(`Assignment submitted: ${botUser.id}, ${step.id}, ${submission.type}`);
  }
}
