import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { MessageTemplatesService } from './message-templates.service';
import { BotBusinessLogic } from './bot-business-logic.service';

export interface BotConfig {
  id: string;
  courseId: string;
  token: string;
  name: string;
  welcomeMessage: string;
  settings: Record<string, any>;
}

@Injectable()
export class BotInstanceManager {
  private readonly logger = new Logger(BotInstanceManager.name);
  private bots = new Map<string, Telegraf>();
  private botConfigs = new Map<string, BotConfig>();

  constructor(
    private prisma: PrismaService,
    private messageTemplates: MessageTemplatesService,
    private businessLogic: BotBusinessLogic,
  ) {}

  async createBotInstance(botConfig: BotConfig): Promise<Telegraf> {
    this.logger.log(`Creating bot instance: ${botConfig.id}`);

    const bot = new Telegraf(botConfig.token);

    try {
      // Установка команд бота
      await bot.telegram.setMyCommands([
        { command: 'start', description: 'Начать обучение' },
        { command: 'progress', description: 'Мой прогресс' },
        { command: 'courses', description: 'Открыть курс' },
        { command: 'help', description: 'Помощь' },
        { command: 'settings', description: 'Настройки' },
      ]);

      // Регистрация middleware
      bot.use(this.createLoggingMiddleware(botConfig.id));
      bot.use(this.createAnalyticsMiddleware(botConfig.id));

      // Регистрация обработчиков
      this.setupMessageHandlers(bot, botConfig);
      this.setupCallbackHandlers(bot, botConfig);
      this.setupWebAppHandlers(bot, botConfig);

      // Сохранение в кеше
      this.bots.set(botConfig.id, bot);
      this.botConfigs.set(botConfig.id, botConfig);

      this.logger.log(`Bot instance created: ${botConfig.id}`);
      return bot;
    } catch (error) {
      this.logger.error(`Failed to create bot instance: ${error.message}`);
      throw error;
    }
  }

  private setupMessageHandlers(bot: Telegraf, config: BotConfig) {
    // Команда /start
    bot.start(async (ctx) => {
      const startTime = Date.now();
      try {
        await this.businessLogic.handleStart(ctx, config);
      } catch (error) {
        this.logger.error(`Error in /start handler: ${error.message}`);
        await ctx.reply('Произошла ошибка. Попробуйте позже.');
      }
      await this.logMessage(ctx, config.id, 'start_command', Date.now() - startTime);
    });

    // Команда /progress
    bot.command('progress', async (ctx) => {
      const startTime = Date.now();
      try {
        await this.businessLogic.handleProgress(ctx, config);
      } catch (error) {
        this.logger.error(`Error in /progress handler: ${error.message}`);
        await ctx.reply('Произошла ошибка при получении прогресса.');
      }
      await this.logMessage(ctx, config.id, 'progress_command', Date.now() - startTime);
    });

    // Команда /courses 
    bot.command('courses', async (ctx) => {
      const startTime = Date.now();
      try {
        await this.businessLogic.handleCourses(ctx, config);
      } catch (error) {
        this.logger.error(`Error in /courses handler: ${error.message}`);
        await ctx.reply('Произошла ошибка при загрузке курсов.');
      }
      await this.logMessage(ctx, config.id, 'courses_command', Date.now() - startTime);
    });

    // Команда /help
    bot.help(async (ctx) => {
      const helpMessage = this.messageTemplates.help(config);
      await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
    });

    // Текстовые сообщения
    bot.on('text', async (ctx) => {
      const startTime = Date.now();
      try {
        await this.businessLogic.handleTextMessage(ctx, config);
      } catch (error) {
        this.logger.error(`Error in text handler: ${error.message}`);
      }
      await this.logMessage(ctx, config.id, 'text_message', Date.now() - startTime);
    });

    // Фото для заданий
    bot.on('photo', async (ctx) => {
      const startTime = Date.now();
      try {
        await this.businessLogic.handlePhotoMessage(ctx, config);
      } catch (error) {
        this.logger.error(`Error in photo handler: ${error.message}`);
      }
      await this.logMessage(ctx, config.id, 'photo_message', Date.now() - startTime);
    });

    // Документы для заданий
    bot.on('document', async (ctx) => {
      const startTime = Date.now();
      try {
        await this.businessLogic.handleDocumentMessage(ctx, config);
      } catch (error) {
        this.logger.error(`Error in document handler: ${error.message}`);
      }
      await this.logMessage(ctx, config.id, 'document_message', Date.now() - startTime);
    });
  }

  private setupCallbackHandlers(bot: Telegraf, config: BotConfig) {
    // Навигация по этапам курса
    bot.action(/^step_(.+)$/, async (ctx) => {
      const stepId = ctx.match[1];
      const startTime = Date.now();
      try {
        await this.businessLogic.handleStepNavigation(ctx, config, stepId);
        await ctx.answerCbQuery();
      } catch (error) {
        this.logger.error(`Error in step navigation: ${error.message}`);
        await ctx.answerCbQuery('Произошла ошибка');
      }
      await this.logMessage(ctx, config.id, 'step_navigation', Date.now() - startTime);
    });

    // Ответы на квизы
    bot.action(/^quiz_(.+)_(\d+)_(.+)$/, async (ctx) => {
      const [, stepId, questionIndex, answer] = ctx.match;
      const startTime = Date.now();
      try {
        await this.businessLogic.handleQuizAnswer(
          ctx,
          config,
          stepId,
          parseInt(questionIndex),
          answer,
        );
        await ctx.answerCbQuery();
      } catch (error) {
        this.logger.error(`Error in quiz answer: ${error.message}`);
        await ctx.answerCbQuery('Произошла ошибка');
      }
      await this.logMessage(ctx, config.id, 'quiz_answer', Date.now() - startTime);
    });

    // Навигационные кнопки
    bot.action('next_step', async (ctx) => {
      try {
        await this.businessLogic.handleNextStep(ctx, config);
        await ctx.answerCbQuery();
      } catch (error) {
        this.logger.error(`Error in next step: ${error.message}`);
        await ctx.answerCbQuery('Произошла ошибка');
      }
    });

    bot.action('prev_step', async (ctx) => {
      try {
        await this.businessLogic.handlePrevStep(ctx, config);
        await ctx.answerCbQuery();
      } catch (error) {
        this.logger.error(`Error in prev step: ${error.message}`);
        await ctx.answerCbQuery('Произошла ошибка');
      }
    });

    bot.action('course_menu', async (ctx) => {
      try {
        await this.businessLogic.handleCourseMenu(ctx, config);
        await ctx.answerCbQuery();
      } catch (error) {
        this.logger.error(`Error in course menu: ${error.message}`);
        await ctx.answerCbQuery('Произошла ошибка');
      }
    });

    bot.action('show_progress', async (ctx) => {
      try {
        await this.businessLogic.handleProgress(ctx, config);
        await ctx.answerCbQuery();
      } catch (error) {
        this.logger.error(`Error in show progress: ${error.message}`);
        await ctx.answerCbQuery('Произошла ошибка');
      }
    });
  }

  private setupWebAppHandlers(bot: Telegraf, config: BotConfig) {
    // Данные из WebApp
    bot.on('web_app_data', async (ctx) => {
      const startTime = Date.now();
      try {
        await this.businessLogic.handleWebAppData(ctx, config);
      } catch (error) {
        this.logger.error(`Error in WebApp data: ${error.message}`);
        await ctx.reply('Произошла ошибка при обработке данных.');
      }
      await this.logMessage(ctx, config.id, 'webapp_data', Date.now() - startTime);
    });
  }

  private createLoggingMiddleware(botId: string) {
    return async (ctx: Context, next: () => Promise<void>) => {
      const startTime = Date.now();
      
      try {
        await next();
      } catch (error) {
        this.logger.error(`Bot ${botId} error: ${error.message}`, error.stack);
        
        // Логируем ошибку в БД
        await this.logError(ctx, botId, error.message);
        
        // Отправляем пользователю сообщение об ошибке
        try {
          await ctx.reply('Произошла ошибка. Наша команда уже работает над её устранением.');
        } catch (replyError) {
          this.logger.error(`Failed to send error message: ${replyError.message}`);
        }
      }
    };
  }

  private createAnalyticsMiddleware(botId: string) {
    return async (ctx: Context, next: () => Promise<void>) => {
      // Обновляем статистику пользователя
      if (ctx.from) {
        await this.updateUserStats(botId, ctx.from.id);
      }
      
      await next();
    };
  }

  private async logMessage(ctx: Context, botId: string, actionType: string, processingTime: number) {
    if (!ctx.from || !ctx.message) return;

    try {
      await this.prisma.botMessageLogs.create({
        data: {
          botId,
          telegramUserId: BigInt(ctx.from.id),
          messageType: this.getMessageType(ctx),
          direction: 'INCOMING',
          content: {
            text: 'text' in ctx.message ? ctx.message.text : null,
            messageId: ctx.message.message_id,
            userId: ctx.from.id,
            username: ctx.from.username,
          },
          telegramMessageId: ctx.message.message_id,
          actionType,
          processingTimeMs: processingTime,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log message: ${error.message}`);
    }
  }

  private async logError(ctx: Context, botId: string, errorMessage: string) {
    if (!ctx.from) return;

    try {
      await this.prisma.botMessageLogs.create({
        data: {
          botId,
          telegramUserId: BigInt(ctx.from.id),
          messageType: 'TEXT',
          direction: 'INCOMING',
          content: { error: true },
          actionType: 'error',
          errorMessage,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log error: ${error.message}`);
    }
  }

  private async updateUserStats(botId: string, telegramId: number) {
    try {
      await this.prisma.botUsers.upsert({
        where: {
          botId_telegramId: {
            botId,
            telegramId: BigInt(telegramId),
          },
        },
        update: {
          messagesCount: { increment: 1 },
          lastInteractionAt: new Date(),
        },
        create: {
          botId,
          telegramId: BigInt(telegramId),
          messagesCount: 1,
          lastInteractionAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update user stats: ${error.message}`);
    }
  }

  private getMessageType(ctx: Context): any {
    if (ctx.message) {
      if ('text' in ctx.message) return 'TEXT';
      if ('photo' in ctx.message) return 'PHOTO';
      if ('video' in ctx.message) return 'VIDEO';
      if ('document' in ctx.message) return 'DOCUMENT';
      if ('audio' in ctx.message) return 'AUDIO';
      if ('voice' in ctx.message) return 'VOICE';
      if ('sticker' in ctx.message) return 'STICKER';
      if ('animation' in ctx.message) return 'ANIMATION';
      if ('location' in ctx.message) return 'LOCATION';
      if ('contact' in ctx.message) return 'CONTACT';
      if ('poll' in ctx.message) return 'POLL';
    }
    if (ctx.callbackQuery) return 'CALLBACK_QUERY';
    if (ctx.inlineQuery) return 'INLINE_QUERY';
    
    return 'TEXT';
  }

  getBotInstance(botId: string): Telegraf | undefined {
    return this.bots.get(botId);
  }

  getBotConfig(botId: string): BotConfig | undefined {
    return this.botConfigs.get(botId);
  }

  async stopBotInstance(botId: string) {
    const bot = this.bots.get(botId);
    if (bot) {
      bot.stop();
      this.bots.delete(botId);
      this.botConfigs.delete(botId);
      this.logger.log(`Bot instance stopped: ${botId}`);
    }
  }

  async startBotInstance(botId: string) {
    const botData = await this.prisma.courseBots.findUnique({
      where: { id: botId },
    });

    if (!botData || !botData.isActive) {
      throw new Error(`Bot ${botId} not found or not active`);
    }

    const config: BotConfig = {
      id: botData.id,
      courseId: botData.courseId,
      token: botData.botToken,
      name: botData.botName,
      welcomeMessage: botData.welcomeMessage || '',
      settings: botData.settings as Record<string, any>,
    };

    const bot = await this.createBotInstance(config);
    
    // Запускаем в режиме polling для разработки
    bot.launch();
    
    this.logger.log(`Bot instance started: ${botId}`);
    return bot;
  }
}
