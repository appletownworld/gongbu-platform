# Bot Service Module

**Сервис:** Telegram Bot Management Service  
**Порт:** 3003  
**Язык:** TypeScript + NestJS + Telegraf  
**Статус:** Integration Service  

---

## 📋 Обзор

Bot Service управляет автоматической генерацией Telegram ботов для каждого курса, обработкой webhook'ов, навигацией по курсу и интеграцией с Telegram Mini-Apps. Каждый опубликованный курс получает собственного уникального бота.

## 🎯 Ответственности

### Основные функции
- **Bot Generation** - создание уникального бота для каждого курса
- **Webhook Processing** - обработка всех Telegram webhook'ов
- **Course Navigation** - навигация студентов по этапам курса
- **Interactive Content** - обработка квизов, заданий, кнопок
- **Mini-App Integration** - поддержка Telegram Mini-Apps
- **Payment Processing** - интеграция с Telegram Payments

### Дополнительные функции
- **Bot Analytics** - статистика использования ботов
- **Message Templates** - шаблоны сообщений для ботов
- **Broadcast Messaging** - массовые рассылки студентам
- **Bot Customization** - настройка внешнего вида и поведения
- **Deep Linking** - поддержка глубоких ссылок

## 🏗️ Database Schema

### Bot Registry
```sql
CREATE TABLE course_bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    
    -- Bot credentials
    bot_token VARCHAR(255) NOT NULL,
    bot_username VARCHAR(100) UNIQUE NOT NULL,
    bot_id BIGINT UNIQUE NOT NULL,
    
    -- Bot settings
    bot_name VARCHAR(100) NOT NULL,
    bot_description TEXT,
    bot_avatar_url TEXT,
    welcome_message TEXT,
    
    -- Configuration
    settings JSONB DEFAULT '{}',
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Stats
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_course_bots_course_id ON course_bots(course_id);
CREATE INDEX idx_course_bots_creator_id ON course_bots(creator_id);
CREATE UNIQUE INDEX idx_course_bots_token ON course_bots(bot_token);
CREATE UNIQUE INDEX idx_course_bots_username ON course_bots(bot_username);
```

### Bot Users (Telegram users interacting with bots)
```sql
CREATE TABLE bot_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES course_bots(id) ON DELETE CASCADE,
    
    -- Telegram user info
    telegram_id BIGINT NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    language_code VARCHAR(10),
    
    -- Platform user reference (if registered)
    platform_user_id UUID, -- References users table in auth service
    
    -- Bot interaction state
    current_step_id UUID,
    bot_state JSONB DEFAULT '{}',
    
    -- Settings
    notifications_enabled BOOLEAN DEFAULT true,
    preferred_language VARCHAR(10) DEFAULT 'ru',
    
    -- Stats
    messages_count INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(bot_id, telegram_id)
);

-- Indexes  
CREATE INDEX idx_bot_users_telegram_id ON bot_users(telegram_id);
CREATE INDEX idx_bot_users_platform_user_id ON bot_users(platform_user_id);
CREATE INDEX idx_bot_users_last_interaction ON bot_users(last_interaction_at);
```

### Bot Messages Log
```sql
CREATE TABLE bot_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES course_bots(id) ON DELETE CASCADE,
    telegram_user_id BIGINT NOT NULL,
    
    -- Message info
    message_type message_type NOT NULL,
    direction direction NOT NULL, -- 'incoming' | 'outgoing'
    
    -- Content
    content JSONB NOT NULL,
    telegram_message_id INTEGER,
    
    -- Context
    step_id UUID,
    action_type VARCHAR(100), -- 'step_navigation', 'quiz_answer', 'assignment_submit', etc.
    
    -- Processing
    processing_time_ms INTEGER,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics
CREATE INDEX idx_message_logs_bot_id ON bot_message_logs(bot_id);
CREATE INDEX idx_message_logs_user_id ON bot_message_logs(telegram_user_id);
CREATE INDEX idx_message_logs_created_at ON bot_message_logs(created_at);
CREATE INDEX idx_message_logs_type ON bot_message_logs(message_type);
```

### Webhook Events
```sql  
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES course_bots(id),
    
    -- Event info
    event_type VARCHAR(100) NOT NULL,
    telegram_update_id BIGINT,
    
    -- Payload
    raw_payload JSONB NOT NULL,
    processed_payload JSONB,
    
    -- Processing status
    status webhook_status DEFAULT 'pending',
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_webhook_events_bot_id ON webhook_events(bot_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);
```

## 📡 API Endpoints

### Bot Management
```yaml
POST /bots/create
  description: Создание бота для курса (вызывается Course Service)
  headers: { Authorization: Bearer <service-token> }
  body: {
    courseId: string,
    creatorId: string,
    botName: string,
    botDescription?: string,
    settings?: BotSettings
  }
  response: {
    success: boolean,
    bot: {
      id: string,
      token: string,
      username: string,
      botId: number
    }
  }

GET /bots/:botId
  description: Получение информации о боте
  headers: { Authorization: Bearer <token> }
  params: { botId: string }
  response: CourseBot

PUT /bots/:botId/settings
  description: Обновление настроек бота
  headers: { Authorization: Bearer <token> }
  params: { botId: string }
  body: {
    botName?: string,
    botDescription?: string,
    welcomeMessage?: string,
    settings?: BotSettings
  }
  response: CourseBot

POST /bots/:botId/activate
  description: Активация бота
  headers: { Authorization: Bearer <token> }
  params: { botId: string }
  response: { success: boolean }

POST /bots/:botId/deactivate
  description: Деактивация бота
  headers: { Authorization: Bearer <token> }
  params: { botId: string }
  response: { success: boolean }

DELETE /bots/:botId
  description: Удаление бота
  headers: { Authorization: Bearer <token> }
  params: { botId: string }
  response: { success: boolean }
```

### Webhook Endpoints
```yaml
POST /webhook/:botId
  description: Webhook endpoint для Telegram
  params: { botId: string }
  headers: { X-Telegram-Bot-Api-Secret-Token: string }
  body: TelegramUpdate
  response: { ok: boolean }

GET /webhook/:botId/info
  description: Информация о webhook'е
  headers: { Authorization: Bearer <token> }
  params: { botId: string }
  response: {
    url: string,
    has_custom_certificate: boolean,
    pending_update_count: number,
    last_error_date?: number,
    last_error_message?: string
  }

POST /webhook/:botId/set
  description: Установка webhook URL
  headers: { Authorization: Bearer <token> }
  params: { botId: string }
  body: {
    url: string,
    secret_token?: string,
    max_connections?: number
  }
  response: { success: boolean }
```

### Broadcasting
```yaml
POST /bots/:botId/broadcast
  description: Массовая рассылка сообщений студентам курса
  headers: { Authorization: Bearer <token> }
  params: { botId: string }
  body: {
    message: {
      text?: string,
      photo?: string,
      video?: string,
      document?: string
    },
    target: {
      all_users?: boolean,
      user_ids?: string[],
      step_id?: string, // Пользователи на определенном этапе
      completed_course?: boolean,
      inactive_days?: number
    },
    schedule?: {
      send_at: string, // ISO timestamp
      timezone: string
    }
  }
  response: {
    broadcast_id: string,
    estimated_recipients: number
  }

GET /broadcasts/:broadcastId/status
  description: Статус массовой рассылки
  headers: { Authorization: Bearer <token> }
  params: { broadcastId: string }
  response: {
    status: 'pending' | 'sending' | 'completed' | 'failed',
    sent_count: number,
    failed_count: number,
    total_count: number,
    started_at?: string,
    completed_at?: string
  }
```

### Analytics
```yaml
GET /bots/:botId/analytics
  description: Аналитика по боту
  headers: { Authorization: Bearer <token> }
  params: { botId: string }
  query: {
    period?: '1d' | '7d' | '30d' | '90d',
    from?: string,
    to?: string
  }
  response: {
    users: {
      total: number,
      active: number,
      new: number
    },
    messages: {
      total: number,
      incoming: number,
      outgoing: number
    },
    engagement: {
      sessions_per_user: number,
      avg_session_duration: number,
      retention_rate: number
    },
    popular_actions: Array<{
      action: string,
      count: number
    }>
  }
```

## 🤖 Bot Engine Architecture

### Bot Instance Manager
```typescript
@Injectable()
export class BotInstanceManager {
  private bots = new Map<string, Telegraf>();
  private botConfigs = new Map<string, BotConfig>();

  constructor(
    private courseService: CourseServiceClient,
    private progressService: ProgressServiceClient,
    private paymentService: PaymentServiceClient
  ) {}

  async createBotInstance(botConfig: BotConfig): Promise<Telegraf> {
    const bot = new Telegraf(botConfig.token);
    
    // Установка команд
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Начать обучение' },
      { command: 'progress', description: 'Мой прогресс' },
      { command: 'help', description: 'Помощь' },
      { command: 'settings', description: 'Настройки' }
    ]);

    // Регистрация middleware
    bot.use(this.createLoggingMiddleware(botConfig.id));
    bot.use(this.createAuthMiddleware());
    bot.use(this.createAnalyticsMiddleware(botConfig.id));

    // Регистрация обработчиков
    this.setupMessageHandlers(bot, botConfig);
    this.setupCallbackHandlers(bot, botConfig);
    this.setupPaymentHandlers(bot, botConfig);

    this.bots.set(botConfig.id, bot);
    this.botConfigs.set(botConfig.id, botConfig);

    return bot;
  }

  private setupMessageHandlers(bot: Telegraf, config: BotConfig) {
    // Команда /start
    bot.start(async (ctx) => {
      const userId = ctx.from.id;
      const startParam = ctx.startPayload;
      
      await this.handleStart(ctx, config, startParam);
    });

    // Прогресс пользователя
    bot.command('progress', async (ctx) => {
      await this.handleProgress(ctx, config);
    });

    // Текстовые сообщения (ответы на задания)
    bot.on('text', async (ctx) => {
      await this.handleTextMessage(ctx, config);
    });

    // Фото (для заданий)
    bot.on('photo', async (ctx) => {
      await this.handlePhotoMessage(ctx, config);
    });

    // Документы (для заданий)
    bot.on('document', async (ctx) => {
      await this.handleDocumentMessage(ctx, config);
    });
  }

  private setupCallbackHandlers(bot: Telegraf, config: BotConfig) {
    // Навигация по этапам
    bot.action(/^step_(\w+)$/, async (ctx) => {
      const stepId = ctx.match[1];
      await this.handleStepNavigation(ctx, config, stepId);
    });

    // Ответы на квизы
    bot.action(/^quiz_(\w+)_(\d+)_(.+)$/, async (ctx) => {
      const [, stepId, questionIndex, answer] = ctx.match;
      await this.handleQuizAnswer(ctx, config, stepId, parseInt(questionIndex), answer);
    });

    // Управление курсом
    bot.action('next_step', async (ctx) => {
      await this.handleNextStep(ctx, config);
    });

    bot.action('prev_step', async (ctx) => {
      await this.handlePrevStep(ctx, config);
    });

    bot.action('course_menu', async (ctx) => {
      await this.handleCourseMenu(ctx, config);
    });
  }

  private setupPaymentHandlers(bot: Telegraf, config: BotConfig) {
    // Pre-checkout query
    bot.on('pre_checkout_query', async (ctx) => {
      await this.handlePreCheckout(ctx, config);
    });

    // Successful payment
    bot.on('successful_payment', async (ctx) => {
      await this.handleSuccessfulPayment(ctx, config);
    });
  }
}
```

### Message Templates
```typescript
export class MessageTemplates {
  static welcome(course: any, user: any): string {
    return `
🎓 *Добро пожаловать на курс "${course.title}"!*

Привет, ${user.first_name}! 

${course.description}

📚 *О курсе:*
• Всего этапов: ${course.total_steps}
• Примерное время: ${this.formatDuration(course.estimated_duration)}
• Уровень сложности: ${'⭐'.repeat(course.difficulty_level)}

Нажмите "Начать обучение" чтобы перейти к первому этапу.
    `.trim();
  }

  static stepContent(step: any, progress: any): string {
    const progressBar = this.createProgressBar(progress.completed_steps, progress.total_steps);
    
    return `
📖 *Этап ${step.order_index}: ${step.title}*

${step.content.text}

${progressBar}
*Прогресс:* ${progress.completed_steps}/${progress.total_steps} (${progress.percentage}%)

${step.estimated_duration ? `⏱ *Время:* ~${this.formatDuration(step.estimated_duration)}` : ''}
    `.trim();
  }

  static quiz(step: any, questionIndex: number): string {
    const question = step.content.questions[questionIndex];
    const progress = `${questionIndex + 1}/${step.content.questions.length}`;
    
    return `
❓ *Вопрос ${progress}*

${question.question}

${question.explanation ? `💡 *Подсказка:* ${question.explanation}` : ''}
    `.trim();
  }

  static quizOptions(question: any, stepId: string, questionIndex: number): InlineKeyboardMarkup {
    const keyboard = question.options.map((option: string, index: number) => [{
      text: `${String.fromCharCode(65 + index)}) ${option}`,
      callback_data: `quiz_${stepId}_${questionIndex}_${index}`
    }]);

    return { inline_keyboard: keyboard };
  }

  static assignment(step: any): string {
    const assignment = step.content;
    
    return `
📝 *Задание: ${step.title}*

${assignment.instructions}

${assignment.requirements ? 
  `*Требования:*\n${assignment.requirements.map((r: string) => `• ${r}`).join('\n')}` : ''
}

${assignment.examples ? 
  `*Примеры:*\n${assignment.examples.map((e: any) => `• ${e.title}`).join('\n')}` : ''
}

Отправьте ваш ответ следующим сообщением (текст, фото или файл).
    `.trim();
  }

  static paymentRequired(step: any): string {
    return `
💳 *Платный этап*

Для доступа к этапу "${step.title}" необходима оплата.

💰 *Стоимость:* ${step.step_price} ₽

Нажмите "Оплатить" чтобы получить доступ к этапу.
    `.trim();
  }

  static courseCompleted(course: any, stats: any): string {
    return `
🎉 *Поздравляем! Курс "${course.title}" завершен!*

Отличная работа! Вы успешно завершили курс.

📊 *Ваши результаты:*
• Потрачено времени: ${this.formatDuration(stats.total_time)}
• Средняя оценка: ${stats.average_score || 'N/A'}
• Выполнено заданий: ${stats.completed_assignments}

${course.certificate_enabled ? 
  '📜 Сертификат о прохождении курса будет отправлен в ближайшее время.' : ''
}

Спасибо за обучение! 🙏
    `.trim();
  }

  static navigationKeyboard(currentStep: any, hasNext: boolean, hasPrev: boolean): InlineKeyboardMarkup {
    const keyboard = [];
    
    const row1 = [];
    if (hasPrev) {
      row1.push({ text: '⬅️ Назад', callback_data: 'prev_step' });
    }
    if (hasNext) {
      row1.push({ text: '➡️ Далее', callback_data: 'next_step' });
    }
    if (row1.length > 0) keyboard.push(row1);

    keyboard.push([
      { text: '📚 Меню курса', callback_data: 'course_menu' },
      { text: '📊 Прогресс', callback_data: 'show_progress' }
    ]);

    return { inline_keyboard: keyboard };
  }

  private static createProgressBar(completed: number, total: number, length: number = 10): string {
    const percentage = total > 0 ? completed / total : 0;
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} мин`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0 ? 
      `${hours} ч ${remainingMinutes} мин` : 
      `${hours} ч`;
  }
}
```

### Business Logic Handlers
```typescript
@Injectable()
export class BotBusinessLogic {
  constructor(
    private courseService: CourseServiceClient,
    private progressService: ProgressServiceClient,
    private paymentService: PaymentServiceClient,
    private userService: UserServiceClient
  ) {}

  async handleStart(ctx: any, config: BotConfig, startParam?: string): Promise<void> {
    const telegramUserId = ctx.from.id;
    
    // Получение или создание пользователя бота
    let botUser = await this.getBotUser(config.id, telegramUserId);
    if (!botUser) {
      botUser = await this.createBotUser(config.id, ctx.from);
    }

    // Получение курса
    const course = await this.courseService.getCourse(config.courseId);
    
    // Проверка доступа к курсу
    const hasAccess = await this.checkCourseAccess(botUser, course);
    if (!hasAccess) {
      await ctx.reply(MessageTemplates.accessDenied(course));
      return;
    }

    // Получение прогресса
    const progress = await this.progressService.getCourseProgress(
      botUser.platform_user_id, 
      course.id
    );

    // Отправка приветственного сообщения
    const welcomeMessage = MessageTemplates.welcome(course, botUser);
    const keyboard = this.createStartKeyboard(progress);

    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    // Обработка deep link параметра
    if (startParam) {
      await this.handleDeepLink(ctx, config, startParam);
    }
  }

  async handleStepNavigation(ctx: any, config: BotConfig, stepId: string): Promise<void> {
    const telegramUserId = ctx.from.id;
    const botUser = await this.getBotUser(config.id, telegramUserId);
    
    if (!botUser?.platform_user_id) {
      await ctx.answerCbQuery('Необходимо авторизоваться в системе');
      return;
    }

    // Получение этапа
    const step = await this.courseService.getStep(stepId);
    if (!step) {
      await ctx.answerCbQuery('Этап не найден');
      return;
    }

    // Проверка доступа к этапу
    const hasAccess = await this.checkStepAccess(botUser.platform_user_id, step);
    if (!hasAccess) {
      if (step.is_paid) {
        await this.handlePaidStep(ctx, step);
      } else {
        await ctx.answerCbQuery('Этап недоступен');
      }
      return;
    }

    // Обновление состояния пользователя
    await this.updateBotUserState(botUser.id, { current_step_id: stepId });

    // Отправка контента этапа
    await this.sendStepContent(ctx, step, botUser.platform_user_id);
    
    await ctx.answerCbQuery();
  }

  async handleQuizAnswer(
    ctx: any, 
    config: BotConfig, 
    stepId: string, 
    questionIndex: number, 
    answerIndex: string
  ): Promise<void> {
    const telegramUserId = ctx.from.id;
    const botUser = await this.getBotUser(config.id, telegramUserId);
    
    if (!botUser?.platform_user_id) {
      await ctx.answerCbQuery('Ошибка авторизации');
      return;
    }

    // Получение этапа с квизом
    const step = await this.courseService.getStep(stepId);
    const question = step.content.questions[questionIndex];
    const isCorrect = question.correct_answer === parseInt(answerIndex);

    // Сохранение ответа
    await this.progressService.saveQuizAnswer(
      botUser.platform_user_id,
      stepId,
      questionIndex,
      answerIndex,
      isCorrect
    );

    // Обратная связь
    if (isCorrect) {
      await ctx.answerCbQuery('✅ Правильно!');
    } else {
      await ctx.answerCbQuery('❌ Неправильно. Попробуйте еще раз.');
    }

    // Показ объяснения
    if (question.explanation) {
      await ctx.reply(
        `💡 ${question.explanation}`, 
        { parse_mode: 'Markdown' }
      );
    }

    // Переход к следующему вопросу или завершение квиза
    if (questionIndex + 1 < step.content.questions.length) {
      await this.sendQuizQuestion(ctx, step, questionIndex + 1);
    } else {
      await this.completeQuizStep(ctx, botUser.platform_user_id, stepId);
    }
  }

  async handleTextMessage(ctx: any, config: BotConfig): Promise<void> {
    const telegramUserId = ctx.from.id;
    const botUser = await this.getBotUser(config.id, telegramUserId);
    
    if (!botUser?.current_step_id) {
      await ctx.reply('Используйте /start для начала обучения');
      return;
    }

    // Получение текущего этапа
    const step = await this.courseService.getStep(botUser.current_step_id);
    
    if (step.step_type === 'assignment') {
      await this.handleAssignmentSubmission(ctx, botUser, step, {
        type: 'text',
        content: ctx.message.text
      });
    } else {
      await ctx.reply(
        'Сейчас ввод текста не требуется. Используйте кнопки для навигации.',
        { reply_markup: { remove_keyboard: true } }
      );
    }
  }

  private async sendStepContent(ctx: any, step: any, userId: string): Promise<void> {
    const progress = await this.progressService.getCourseProgress(userId, step.course_id);
    
    switch (step.step_type) {
      case 'text':
        await this.sendTextStep(ctx, step, progress);
        break;
      case 'video':
        await this.sendVideoStep(ctx, step, progress);
        break;
      case 'quiz':
        await this.sendQuizStep(ctx, step);
        break;
      case 'assignment':
        await this.sendAssignmentStep(ctx, step);
        break;
      case 'plugin':
        await this.sendPluginStep(ctx, step);
        break;
    }
  }

  private async sendTextStep(ctx: any, step: any, progress: any): Promise<void> {
    const message = MessageTemplates.stepContent(step, progress);
    const keyboard = MessageTemplates.navigationKeyboard(
      step, 
      progress.has_next_step, 
      progress.has_prev_step
    );

    // Отправка основного контента
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    // Отправка изображений, если есть
    if (step.content.images) {
      for (const image of step.content.images) {
        await ctx.replyWithPhoto(image.url, {
          caption: image.caption,
          parse_mode: 'Markdown'
        });
      }
    }

    // Отправка вложений, если есть
    if (step.content.attachments) {
      for (const attachment of step.content.attachments) {
        await ctx.replyWithDocument(attachment.url, {
          caption: `📎 ${attachment.filename}`
        });
      }
    }

    // Автоматическое завершение этапа
    await this.completeStep(ctx, step);
  }
}
```

## 📋 Implementation Checklist

### Phase 1: Core Bot Management
- [ ] Bot creation and registration with BotFather
- [ ] Webhook setup and processing
- [ ] Basic message handling
- [ ] Database schema and migrations
- [ ] Bot instance management

### Phase 2: Course Navigation
- [ ] Step-by-step navigation
- [ ] Progress tracking integration
- [ ] Message templates system
- [ ] Inline keyboard handling
- [ ] Deep linking support

### Phase 3: Interactive Content
- [ ] Quiz engine in Telegram
- [ ] Assignment submission handling
- [ ] File upload processing
- [ ] Payment integration
- [ ] Mini-App support

### Phase 4: Advanced Features
- [ ] Broadcasting system
- [ ] Bot analytics
- [ ] Custom commands
- [ ] Multi-language support
- [ ] Bot customization

### Phase 5: Production Features
- [ ] Error handling and recovery
- [ ] Rate limiting protection
- [ ] Monitoring and alerting
- [ ] Performance optimization
- [ ] Security hardening

---

## 🔗 Dependencies

### Internal Services
- Course Service (course data, steps, content)
- Auth Service (user authentication, platform users)
- Payment Service (paid steps, subscriptions)
- Progress Service (learning progress tracking)
- Plugin Service (plugin step content)

### External Dependencies
- Telegram Bot API (bot operations)
- Telegram Webhook API (receiving updates)
- File storage service (handling uploaded files)
- Redis (bot state, session management)
- PostgreSQL (bot registry, user data)

### Libraries
- `telegraf` - Telegram bot framework
- `@telegraf/session` - Session management
- `multer` - File upload handling
- `axios` - HTTP client for service calls
- `node-cron` - Scheduled tasks (broadcasts)
