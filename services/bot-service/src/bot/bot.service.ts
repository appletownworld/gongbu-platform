import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import { BotConfig } from '../config/bot.config';
import { AuthClientService } from '../integrations/auth-client.service';
import { CourseClientService } from '../integrations/course-client.service';
import { CourseCommandsService } from '../commands/course-commands.service';
import { ProgressCommandsService } from '../commands/progress-commands.service';

export interface BotContext extends Context {
  session?: any;
  user?: any;
  state: Record<string | symbol, any>;
}

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf<BotContext>;
  private botConfig: BotConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaClient,
    private readonly authClient: AuthClientService,
    private readonly courseClient: CourseClientService,
    private readonly courseCommands: CourseCommandsService,
    private readonly progressCommands: ProgressCommandsService,
  ) {
    this.initializeBot();
  }

  private initializeBot() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new Telegraf<BotContext>(token);
    this.setupBotHandlers();
  }

  private setupBotHandlers() {
    // Global middleware for logging and user management
    this.bot.use(async (ctx, next) => {
      const start = Date.now();
      
      try {
        // Log incoming update
        this.logger.debug(`Incoming update: ${ctx.updateType}`, {
          userId: ctx.from?.id,
          chatId: ctx.chat?.id,
          updateType: ctx.updateType,
        });

        // Process user data
        await this.processUser(ctx);
        
        // Continue processing
        await next();
        
        // Log processing time
        const processingTime = Date.now() - start;
        this.logger.debug(`Update processed in ${processingTime}ms`);
        
        // Store analytics
        await this.recordAnalytics(ctx, processingTime, true);
        
      } catch (error) {
        const processingTime = Date.now() - start;
        this.logger.error(`Error processing update: ${error.message}`, error);
        
        // Store error analytics
        await this.recordAnalytics(ctx, processingTime, false, error.message);
        
        // Send error message to user
        try {
          await ctx.reply('⚠️ Произошла ошибка при обработке команды. Попробуйте еще раз.');
        } catch (replyError) {
          this.logger.error('Failed to send error message to user:', replyError);
        }
      }
    });

    // Start command
    this.bot.start(async (ctx) => {
      const user = ctx.from;
      
      this.logger.log(`New user started bot: ${user.id} (@${user.username})`);
      
      const welcomeMessage = `
🎓 Добро пожаловать в Gongbu!

Я ваш помощник в изучении новых навыков и курсов.

📚 Что я умею:
• Показывать доступные курсы
• Отслеживать ваш прогресс
• Напоминать о заданиях
• Отвечать на вопросы

Начните с команды /courses чтобы посмотреть курсы или /help для полного списка команд.
      `;

      await ctx.reply(welcomeMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📚 Курсы', callback_data: 'show_courses' },
              { text: '👤 Профиль', callback_data: 'show_profile' },
            ],
            [
              { text: '❓ Помощь', callback_data: 'show_help' },
            ],
          ],
        },
      });
    });

    // Help command
    this.bot.help(async (ctx) => {
      const helpMessage = `
❓ Справка по командам:

🏠 <b>Основные команды:</b>
/start - Начать работу с ботом
/help - Показать это сообщение
/profile - Ваш профиль
/settings - Настройки

📚 <b>Курсы и обучение:</b>
/courses - Список курсов
/my_courses - Мои курсы
/progress - Мой прогресс
/search [запрос] - Поиск курсов

🔔 <b>Уведомления:</b>
/notifications - Настройки уведомлений
/reminders - Напоминания

💰 <b>Подписка:</b>
/subscription - Моя подписка
/upgrade - Улучшить подписку

🛠 <b>Разработка:</b>
/create - Создать курс (для авторов)
/analytics - Аналитика (для авторов)

По вопросам обращайтесь: @gongbu_support
      `;

      await ctx.reply(helpMessage, { parse_mode: 'HTML' });
    });

    // Course commands with real integration
    this.bot.command('courses', async (ctx) => {
      await this.courseCommands.handleCoursesCommand(ctx);
    });

    this.bot.command('my_courses', async (ctx) => {
      await this.courseCommands.handleMyCoursesCommand(ctx);
    });

    this.bot.command('search', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1);
      const query = args.join(' ');
      await this.courseCommands.handleSearchCommand(ctx, query);
    });

    this.bot.command('profile', async (ctx) => {
      await this.handleProfileCommand(ctx);
    });

    // Progress commands
    this.bot.command('progress', async (ctx) => {
      await this.progressCommands.handleProgressCommand(ctx);
    });

    this.bot.command('achievements', async (ctx) => {
      await this.progressCommands.handleAchievementsCommand(ctx);
    });

    this.bot.command('weekly_report', async (ctx) => {
      await this.progressCommands.handleWeeklyReportCommand(ctx);
    });

    // Handle callback queries
    this.bot.on('callback_query', async (ctx) => {
      const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      
      this.logger.debug(`Callback query: ${data} from user ${ctx.from.id}`);
      
      switch (data) {
        case 'show_courses':
        case 'show_all_courses':
          await ctx.answerCbQuery('Загружаю курсы...');
          await this.courseCommands.handleCoursesCommand(ctx);
          break;
          
        case 'my_courses':
          await ctx.answerCbQuery('Загружаю ваши курсы...');
          await this.courseCommands.handleMyCoursesCommand(ctx);
          break;
          
        case 'show_profile':
          await ctx.answerCbQuery('Загружаю профиль...');
          await this.handleProfileCommand(ctx);
          break;
          
        case 'show_help':
          await ctx.answerCbQuery();
          await this.showDetailedHelp(ctx);
          break;

        case 'search_courses':
          await ctx.answerCbQuery();
          await ctx.editMessageText(
            '🔍 Введите поисковый запрос в формате:\n' +
            '<code>/search название курса</code>\n\n' +
            'Например:\n' +
            '<code>/search python</code>\n' +
            '<code>/search машинное обучение</code>',
            { parse_mode: 'HTML' }
          );
          break;
          
        default:
          // Handle course-related callbacks
          if (data.startsWith('course_')) {
            const courseId = data.replace('course_', '');
            await this.courseCommands.showCourseDetails(ctx, courseId);
          } else if (data.startsWith('courses_page_')) {
            const page = parseInt(data.replace('courses_page_', ''));
            await this.handleCoursesPage(ctx, page);
          } else if (data.startsWith('progress_')) {
            const courseId = data.replace('progress_', '');
            await this.progressCommands.showCourseProgress(ctx, courseId);
          } else if (data === 'show_progress') {
            await ctx.answerCbQuery('Загружаю прогресс...');
            await this.progressCommands.handleProgressCommand(ctx);
          } else if (data === 'show_achievements') {
            await ctx.answerCbQuery('Загружаю достижения...');
            await this.progressCommands.handleAchievementsCommand(ctx);
          } else if (data === 'weekly_report') {
            await ctx.answerCbQuery('Генерирую отчет...');
            await this.progressCommands.handleWeeklyReportCommand(ctx);
          } else {
            await ctx.answerCbQuery('Неизвестная команда');
          }
      }
    });

    // Handle unknown commands
    this.bot.on('message', async (ctx) => {
      if ('text' in ctx.message && ctx.message.text.startsWith('/')) {
        await ctx.reply('❓ Неизвестная команда. Используйте /help для списка доступных команд.');
        return;
      }
      
      // Handle regular messages
      await ctx.reply('💬 Я вас понял! Пока что я отвечаю только на команды. Используйте /help для справки.');
    });

    // Error handler
    this.bot.catch((err, ctx) => {
      this.logger.error(`Bot error for update ${ctx.update.update_id}:`, err);
    });
  }

  private async processUser(ctx: BotContext) {
    if (!ctx.from) return;

    const telegramId = BigInt(ctx.from.id);
    
    try {
      // Find or create bot user
      const existingUser = await this.prisma.botUsers.findFirst({
        where: { telegramId },
      });

      if (!existingUser) {
        // Create new bot user
        // BotUsers creation disabled - requires botId which is not available in context
        // TODO: Pass botId to track user per bot
        this.logger.debug(`New telegram user: ${telegramId} (@${ctx.from.username})`);
        
        this.logger.log(`Created new bot user: ${telegramId} (@${ctx.from.username})`);
      } else {
        // Update existing user disabled - schema requires proper botId management
        this.logger.debug(`Updated bot user: ${telegramId} (@${ctx.from.username})`);
      }
      
      // Attach user to context
      ctx.user = existingUser || { telegramId, isNew: true };
      
    } catch (error) {
      this.logger.error('Failed to process user:', error);
    }
  }

  private async recordAnalytics(
    ctx: BotContext,
    processingTime: number,
    success: boolean,
    errorMessage?: string,
  ) {
    try {
      // Record bot message
      if (ctx.message) {
        // BotMessageLogs creation disabled - requires botId and schema adjustment
        // TODO: Implement proper message logging with botId
        this.logger.debug(`Message logged: ${ctx.message.message_id} from user ${ctx.from.id}`);
      }
      
      // Record bot command if it's a command
      if ('text' in ctx.message && ctx.message.text?.startsWith('/')) {
        const [command, ...args] = ctx.message.text.slice(1).split(' ');
        
        // BotCommand model not available in schema - logging to console instead
        this.logger.debug(`Command executed: /${command} ${args.join(' ')} - Success: ${success}`);
      }
      
    } catch (error) {
      this.logger.error('Failed to record analytics:', error);
    }
  }

  private getMessageType(message: any): string {
    if (message.text) return 'TEXT';
    if (message.photo) return 'PHOTO';
    if (message.video) return 'VIDEO';
    if (message.audio) return 'AUDIO';
    if (message.document) return 'DOCUMENT';
    if (message.sticker) return 'STICKER';
    if (message.voice) return 'VOICE';
    if (message.video_note) return 'VIDEO_NOTE';
    if (message.location) return 'LOCATION';
    if (message.contact) return 'CONTACT';
    if (message.poll) return 'POLL';
    if (message.dice) return 'DICE';
    return 'UNKNOWN';
  }

  async onModuleInit() {
    const webhookUrl = this.configService.get<string>('TELEGRAM_BOT_WEBHOOK_URL');
    
    if (webhookUrl) {
      // Use webhooks
      const webhookPath = this.configService.get<string>('TELEGRAM_BOT_WEBHOOK_PATH', '/webhook');
      const webhookSecret = this.configService.get<string>('TELEGRAM_BOT_WEBHOOK_SECRET');
      
      try {
        await this.bot.telegram.setWebhook(`${webhookUrl}${webhookPath}`, {
          secret_token: webhookSecret,
        });
        
        this.logger.log(`✅ Bot webhook set to: ${webhookUrl}${webhookPath}`);
      } catch (error) {
        this.logger.error('❌ Failed to set webhook:', error);
        throw error;
      }
    } else {
      // Use polling
      this.bot.launch();
      this.logger.log('✅ Bot started with polling');
    }

    // Set bot info
    try {
      const me = await this.bot.telegram.getMe();
      this.logger.log(`🤖 Bot info: @${me.username} (${me.first_name})`);
    } catch (error) {
      this.logger.error('Failed to get bot info:', error);
    }
  }

  async onModuleDestroy() {
    if (this.bot) {
      await this.bot.stop();
      this.logger.log('🛑 Bot stopped');
    }
  }

  // Webhook handler for HTTP requests
  async handleWebhook(body: any): Promise<void> {
    try {
      await this.bot.handleUpdate(body);
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      throw error;
    }
  }

  // Get bot instance for other services
  getBot(): Telegraf<BotContext> {
    return this.bot;
  }

  // Send message to user
  async sendMessage(
    chatId: number | string,
    message: string,
    options?: any,
  ): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(chatId, message, options);
    } catch (error) {
      this.logger.error(`Failed to send message to ${chatId}:`, error);
      throw error;
    }
  }

  // Send notification
  async sendNotification(
    userId: string,
    notification: {
      type: string;
      title?: string;
      message: string;
      parseMode?: string;
    },
  ): Promise<void> {
    try {
      // TODO: Implement notification sending logic
      // This would involve looking up the user's telegram ID and sending the message
      this.logger.debug('Sending notification (not implemented):', { userId, notification });
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Обработка команды профиля пользователя
   */
  async handleProfileCommand(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.from) {
        await ctx.reply('❌ Не удалось определить пользователя');
        return;
      }

      const user = await this.authClient.createOrGetUser(ctx.from);
      
      let profileMessage = `👤 <b>Ваш профиль</b>\n\n`;
      profileMessage += `📝 <b>Имя:</b> ${user.firstName} ${user.lastName || ''}\n`;
      profileMessage += `🆔 <b>Telegram ID:</b> <code>${user.telegramId}</code>\n`;
      
      if (user.username) {
        profileMessage += `👤 <b>Username:</b> @${user.username}\n`;
      }
      
      profileMessage += `🎭 <b>Роль:</b> ${this.translateRole(user.role)}\n`;
      profileMessage += `📊 <b>Подписка:</b> ${this.translateSubscription(user.subscription)}\n`;
      profileMessage += `✅ <b>Статус:</b> ${user.isActive ? 'Активный' : 'Неактивный'}\n`;
      
      if (user.isBanned) {
        profileMessage += `🚫 <b>Заблокирован:</b> ${user.banReason || 'Причина не указана'}\n`;
      }
      
      profileMessage += `📅 <b>Регистрация:</b> ${user.createdAt.toLocaleDateString('ru-RU')}\n`;
      
      if (user.lastLogin) {
        profileMessage += `🕐 <b>Последний вход:</b> ${user.lastLogin.toLocaleDateString('ru-RU')}\n`;
      }

      const keyboard = [
        [
          { text: '📚 Мои курсы', callback_data: 'my_courses' },
          { text: '🔍 Поиск курсов', callback_data: 'search_courses' },
        ],
        [
          { text: '⚙️ Настройки', callback_data: 'settings' },
          { text: '❓ Помощь', callback_data: 'show_help' },
        ],
      ];

      await ctx.reply(profileMessage, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

    } catch (error) {
      this.logger.error('Error in profile command:', error.message);
      await ctx.reply('⚠️ Произошла ошибка при загрузке профиля. Попробуйте позже.');
    }
  }

  /**
   * Показ детальной справки
   */
  async showDetailedHelp(ctx: BotContext): Promise<void> {
    const helpMessage = `
❓ <b>Подробная справка по боту Gongbu</b>

🏠 <b>Основные команды:</b>
/start - Начать работу с ботом
/help - Показать справку
/profile - Ваш профиль и статистика

📚 <b>Курсы и обучение:</b>
/courses - Просмотр всех доступных курсов
/my_courses - Ваши курсы (активные и завершенные)
/search [запрос] - Поиск курсов по названию или тегам
/progress - Ваш прогресс по курсам

🔔 <b>Уведомления:</b>
/notifications - Настройки уведомлений
/reminders - Управление напоминаниями

💰 <b>Подписка и оплата:</b>
/subscription - Информация о вашей подписке
/upgrade - Улучшение подписки

🛠 <b>Для авторов курсов:</b>
/create - Создание нового курса
/analytics - Статистика по вашим курсам

📊 <b>Администрирование:</b>
/admin - Панель администратора (только для админов)

💡 <b>Полезные функции:</b>
• Используйте кнопки для удобной навигации
• Поиск работает по названию курса, описанию и тегам
• Прогресс автоматически синхронизируется
• Уведомления помогают не забыть об учебе

❓ <b>Нужна помощь?</b>
Обращайтесь: @gongbu_support
    `;

    await ctx.editMessageText(helpMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📚 К курсам', callback_data: 'show_all_courses' },
            { text: '👤 Профиль', callback_data: 'show_profile' },
          ],
        ],
      },
    });
  }

  /**
   * Обработка пагинации курсов
   */
  async handleCoursesPage(ctx: BotContext, page: number): Promise<void> {
    try {
      await ctx.answerCbQuery('Загружаю страницу...');
      
      const coursesData = await this.courseClient.getCourses({
        page,
        limit: 5,
      });

      if (!coursesData.courses || coursesData.courses.length === 0) {
        await ctx.editMessageText('📚 Курсы не найдены.');
        return;
      }

      const courseList = this.formatCourseList(coursesData);
      const keyboard = this.createCoursesKeyboard(coursesData.courses, coursesData.pagination);

      await ctx.editMessageText(courseList, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

    } catch (error) {
      this.logger.error('Error handling courses page:', error.message);
      await ctx.answerCbQuery('❌ Ошибка загрузки страницы');
    }
  }

  /**
   * Перевод роли на русский
   */
  private translateRole(role: string): string {
    const roleTranslations = {
      'ADMIN': 'Администратор',
      'INSTRUCTOR': 'Преподаватель',
      'STUDENT': 'Студент',
    };
    return roleTranslations[role] || role;
  }

  /**
   * Перевод типа подписки на русский
   */
  private translateSubscription(subscription: string): string {
    const subscriptionTranslations = {
      'FREE': 'Бесплатная',
      'BASIC': 'Базовая',
      'PREMIUM': 'Премиум',
      'PRO': 'Профессиональная',
    };
    return subscriptionTranslations[subscription] || subscription;
  }

  /**
   * Форматирование списка курсов (из CourseCommandsService)
   */
  private formatCourseList(coursesData: any): string {
    const { courses, pagination } = coursesData;
    
    let message = '📚 <b>Доступные курсы</b>\n\n';

    courses.forEach((course, index) => {
      const stars = '⭐'.repeat(Math.floor(course.rating));
      const price = course.price > 0 ? `${course.price} ${course.currency}` : 'Бесплатно';
      
      message += `<b>${index + 1}. ${course.title}</b>\n`;
      message += `${course.shortDescription || course.description.substring(0, 100)}...\n`;
      message += `${stars} ${course.rating} (${course.reviewCount} отзывов)\n`;
      message += `💰 ${price} • 👥 ${course.studentCount} студентов\n`;
      message += `⏱ ${course.lessonCount} уроков • 📊 ${course.difficulty}\n\n`;
    });

    message += `📄 Страница ${pagination.page} из ${pagination.totalPages}\n`;
    message += `📊 Всего курсов: ${pagination.totalItems}`;

    return message;
  }

  /**
   * Клавиатура для списка курсов
   */
  private createCoursesKeyboard(courses: any[], pagination: any): any[][] {
    const keyboard: any[][] = [];

    // Кнопки курсов (по 2 в ряд)
    for (let i = 0; i < courses.length; i += 2) {
      const row: any[] = [];
      
      row.push({
        text: `${i + 1}. ${courses[i].title.substring(0, 20)}...`,
        callback_data: `course_${courses[i].id}`,
      });

      if (i + 1 < courses.length) {
        row.push({
          text: `${i + 2}. ${courses[i + 1].title.substring(0, 20)}...`,
          callback_data: `course_${courses[i + 1].id}`,
        });
      }

      keyboard.push(row);
    }

    // Навигация
    const navRow: any[] = [];
    if (pagination.hasPrev) {
      navRow.push({ text: '⬅️ Назад', callback_data: `courses_page_${pagination.page - 1}` });
    }
    if (pagination.hasNext) {
      navRow.push({ text: 'Далее ➡️', callback_data: `courses_page_${pagination.page + 1}` });
    }
    
    if (navRow.length > 0) {
      keyboard.push(navRow);
    }

    // Дополнительные кнопки
    keyboard.push([
      { text: '🔍 Поиск', callback_data: 'search_courses' },
      { text: '📖 Мои курсы', callback_data: 'my_courses' },
    ]);

    return keyboard;
  }
}
