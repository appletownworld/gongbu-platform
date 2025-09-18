import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBotDto, UpdateBotSettingsDto } from './dto/create-bot.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { generateBotToken } from '../utils/bot-token-generator';

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async createBot(createBotDto: CreateBotDto) {
    this.logger.log(`Creating bot for course: ${createBotDto.courseId}`);

    // В реальной реализации здесь будет интеграция с BotFather API
    // Пока генерируем фейковые данные
    const botToken = generateBotToken();
    const botUsername = `course_${createBotDto.courseId}_bot`;
    const botId = BigInt(Date.now()); // В реальности - от Telegram

    try {
      // Создаем запись в БД
      const bot = await this.prisma.courseBots.create({
        data: {
          courseId: createBotDto.courseId,
          creatorId: createBotDto.creatorId,
          botToken,
          botUsername,
          botId,
          botName: createBotDto.botName,
          botDescription: createBotDto.botDescription,
          welcomeMessage: createBotDto.welcomeMessage || `Добро пожаловать на курс "${createBotDto.botName}"!`,
          settings: createBotDto.settings || {},
        },
      });

      this.logger.log(`Bot created successfully: ${bot.id}`);
      
      return {
        success: true,
        bot: {
          id: bot.id,
          token: bot.botToken,
          username: bot.botUsername,
          botId: bot.botId,
          name: bot.botName,
          description: bot.botDescription,
          isActive: bot.isActive,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create bot: ${error.message}`);
      throw new BadRequestException('Failed to create bot');
    }
  }

  async getBotById(botId: string) {
    const bot = await this.prisma.courseBots.findUnique({
      where: { id: botId },
      include: {
        users: {
          take: 10,
          orderBy: { lastInteractionAt: 'desc' },
        },
        _count: {
          select: {
            users: true,
            messageLogs: true,
            broadcasts: true,
          },
        },
      },
    });

    if (!bot) {
      throw new BadRequestException('Bot not found');
    }

    return bot;
  }

  async getBotsByCourse(courseId: string) {
    return this.prisma.courseBots.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            users: true,
            messageLogs: true,
          },
        },
      },
    });
  }

  async getBotsbyCreator(creatorId: string) {
    return this.prisma.courseBots.findMany({
      where: { creatorId },
      include: {
        _count: {
          select: {
            users: true,
            messageLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBotSettings(botId: string, updateDto: UpdateBotSettingsDto) {
    const bot = await this.prisma.courseBots.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      throw new BadRequestException('Bot not found');
    }

    return this.prisma.courseBots.update({
      where: { id: botId },
      data: {
        ...(updateDto.botName && { botName: updateDto.botName }),
        ...(updateDto.botDescription && { botDescription: updateDto.botDescription }),
        ...(updateDto.welcomeMessage && { welcomeMessage: updateDto.welcomeMessage }),
        ...(updateDto.settings && { settings: updateDto.settings }),
        updatedAt: new Date(),
      },
    });
  }

  async activateBot(botId: string) {
    await this.prisma.courseBots.update({
      where: { id: botId },
      data: { isActive: true },
    });

    this.logger.log(`Bot activated: ${botId}`);
    return { success: true };
  }

  async deactivateBot(botId: string) {
    await this.prisma.courseBots.update({
      where: { id: botId },
      data: { isActive: false },
    });

    this.logger.log(`Bot deactivated: ${botId}`);
    return { success: true };
  }

  async deleteBot(botId: string) {
    const bot = await this.prisma.courseBots.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      throw new BadRequestException('Bot not found');
    }

    // Мягкое удаление
    await this.prisma.courseBots.update({
      where: { id: botId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    this.logger.log(`Bot deleted: ${botId}`);
    return { success: true };
  }

  async getBotAnalytics(botId: string, period: '1d' | '7d' | '30d' | '90d' = '7d') {
    const bot = await this.prisma.courseBots.findUnique({
      where: { id: botId },
      include: {
        _count: {
          select: {
            users: true,
            messageLogs: true,
          },
        },
      },
    });

    if (!bot) {
      throw new BadRequestException('Bot not found');
    }

    const days = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 }[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Статистика пользователей
    const activeUsers = await this.prisma.botUsers.count({
      where: {
        botId,
        lastInteractionAt: {
          gte: startDate,
        },
      },
    });

    const newUsers = await this.prisma.botUsers.count({
      where: {
        botId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Статистика сообщений
    const messages = await this.prisma.botMessageLogs.findMany({
      where: {
        botId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    const incomingMessages = messages.filter(m => m.direction === 'INCOMING').length;
    const outgoingMessages = messages.filter(m => m.direction === 'OUTGOING').length;

    // Популярные действия
    const actionCounts = messages.reduce((acc, msg) => {
      if (msg.actionType) {
        acc[msg.actionType] = (acc[msg.actionType] || 0) + 1;
      }
      return acc;
    }, {});

    const popularActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 10);

    return {
      users: {
        total: bot.totalUsers,
        active: activeUsers,
        new: newUsers,
      },
      messages: {
        total: messages.length,
        incoming: incomingMessages,
        outgoing: outgoingMessages,
      },
      engagement: {
        sessions_per_user: activeUsers > 0 ? messages.length / activeUsers : 0,
        avg_session_duration: 0, // TODO: calculate based on message intervals
        retention_rate: bot.totalUsers > 0 ? (activeUsers / bot.totalUsers) * 100 : 0,
      },
      popular_actions: popularActions,
    };
  }

  // Webhook methods
  async setWebhook(botId: string, url: string, secretToken?: string) {
    const bot = await this.prisma.courseBots.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      throw new BadRequestException('Bot not found');
    }

    // В реальной реализации - вызов Telegram API
    try {
      await this.prisma.courseBots.update({
        where: { id: botId },
        data: {
          webhookUrl: url,
          webhookSecret: secretToken,
        },
      });

      this.logger.log(`Webhook set for bot ${botId}: ${url}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to set webhook: ${error.message}`);
      throw new BadRequestException('Failed to set webhook');
    }
  }

  async getWebhookInfo(botId: string) {
    const bot = await this.prisma.courseBots.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      throw new BadRequestException('Bot not found');
    }

    return {
      url: bot.webhookUrl || '',
      has_custom_certificate: false,
      pending_update_count: 0,
      last_error_date: null,
      last_error_message: null,
    };
  }
}
