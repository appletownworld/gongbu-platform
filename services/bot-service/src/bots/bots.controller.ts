import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BotsService } from './bots.service';
import { BotInstanceManager } from './bot-instance-manager.service';
import { WebhookService } from './webhook.service';
import { CreateBotDto, UpdateBotSettingsDto, SetWebhookDto } from './dto/create-bot.dto';

@ApiTags('bots')
@Controller('bots')
export class BotsController {
  private readonly logger = new Logger(BotsController.name);

  constructor(
    private botsService: BotsService,
    private botInstanceManager: BotInstanceManager,
    private webhookService: WebhookService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Создание бота для курса' })
  @ApiResponse({ status: 201, description: 'Бот успешно создан' })
  @ApiResponse({ status: 400, description: 'Неверные параметры' })
  async createBot(@Body() createBotDto: CreateBotDto) {
    this.logger.log(`Creating bot for course: ${createBotDto.courseId}`);
    
    const result = await this.botsService.createBot(createBotDto);
    
    // Запуск экземпляра бота
    if (result.success) {
      try {
        await this.botInstanceManager.startBotInstance(result.bot.id);
        this.logger.log(`Bot instance started: ${result.bot.id}`);
      } catch (error) {
        this.logger.error(`Failed to start bot instance: ${error.message}`);
      }
    }
    
    return result;
  }

  @Get(':botId')
  @ApiOperation({ summary: 'Получение информации о боте' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  @ApiResponse({ status: 200, description: 'Информация о боте' })
  @ApiResponse({ status: 404, description: 'Бот не найден' })
  async getBotById(@Param('botId') botId: string) {
    return this.botsService.getBotById(botId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Получение ботов для курса' })
  @ApiParam({ name: 'courseId', description: 'ID курса' })
  async getBotsByCourse(@Param('courseId') courseId: string) {
    return this.botsService.getBotsByCourse(courseId);
  }

  @Get('creator/:creatorId')
  @ApiOperation({ summary: 'Получение ботов создателя' })
  @ApiParam({ name: 'creatorId', description: 'ID создателя' })
  async getBotsByCreator(@Param('creatorId') creatorId: string) {
    return this.botsService.getBotsbyCreator(creatorId);
  }

  @Put(':botId/settings')
  @ApiOperation({ summary: 'Обновление настроек бота' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  async updateBotSettings(
    @Param('botId') botId: string,
    @Body() updateDto: UpdateBotSettingsDto,
  ) {
    return this.botsService.updateBotSettings(botId, updateDto);
  }

  @Post(':botId/activate')
  @ApiOperation({ summary: 'Активация бота' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  @HttpCode(HttpStatus.OK)
  async activateBot(@Param('botId') botId: string) {
    const result = await this.botsService.activateBot(botId);
    
    // Запуск экземпляра бота
    try {
      await this.botInstanceManager.startBotInstance(botId);
    } catch (error) {
      this.logger.error(`Failed to start bot instance: ${error.message}`);
    }
    
    return result;
  }

  @Post(':botId/deactivate')
  @ApiOperation({ summary: 'Деактивация бота' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  @HttpCode(HttpStatus.OK)
  async deactivateBot(@Param('botId') botId: string) {
    // Остановка экземпляра бота
    await this.botInstanceManager.stopBotInstance(botId);
    
    return this.botsService.deactivateBot(botId);
  }

  @Delete(':botId')
  @ApiOperation({ summary: 'Удаление бота' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  async deleteBot(@Param('botId') botId: string) {
    // Остановка экземпляра бота перед удалением
    await this.botInstanceManager.stopBotInstance(botId);
    
    return this.botsService.deleteBot(botId);
  }

  @Get(':botId/analytics')
  @ApiOperation({ summary: 'Аналитика по боту' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  @ApiQuery({ name: 'period', required: false, enum: ['1d', '7d', '30d', '90d'] })
  async getBotAnalytics(
    @Param('botId') botId: string,
    @Query('period') period?: '1d' | '7d' | '30d' | '90d',
  ) {
    return this.botsService.getBotAnalytics(botId, period);
  }

  // Webhook endpoints
  @Post('webhook/:botId')
  @ApiOperation({ summary: 'Webhook endpoint для Telegram' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Param('botId') botId: string, @Body() update: any) {
    await this.webhookService.handleWebhook(botId, update);
    return { ok: true };
  }

  @Get('webhook/:botId/info')
  @ApiOperation({ summary: 'Информация о webhook' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  async getWebhookInfo(@Param('botId') botId: string) {
    return this.botsService.getWebhookInfo(botId);
  }

  @Post('webhook/:botId/set')
  @ApiOperation({ summary: 'Установка webhook URL' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  @HttpCode(HttpStatus.OK)
  async setWebhook(@Param('botId') botId: string, @Body() setWebhookDto: SetWebhookDto) {
    return this.botsService.setWebhook(
      botId,
      setWebhookDto.url,
      setWebhookDto.secret_token,
    );
  }

  // Broadcasting endpoints
  @Post(':botId/broadcast')
  @ApiOperation({ summary: 'Массовая рассылка' })
  @ApiParam({ name: 'botId', description: 'ID бота' })
  async createBroadcast(@Param('botId') botId: string, @Body() broadcastData: any) {
    // TODO: Implement broadcast functionality
    return { 
      broadcast_id: 'broadcast_' + Date.now(),
      estimated_recipients: 0 
    };
  }

  @Get('broadcasts/:broadcastId/status')
  @ApiOperation({ summary: 'Статус массовой рассылки' })
  @ApiParam({ name: 'broadcastId', description: 'ID рассылки' })
  async getBroadcastStatus(@Param('broadcastId') broadcastId: string) {
    // TODO: Implement broadcast status
    return {
      status: 'completed',
      sent_count: 0,
      failed_count: 0,
      total_count: 0,
    };
  }

  // Health check
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async healthCheck() {
    return {
      status: 'OK',
      service: 'Bot Service',
      timestamp: new Date().toISOString(),
      active_bots: this.botInstanceManager['bots'].size,
    };
  }
}
