import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor() {
    this.logger.log('🤖 Bot Service initialized');
  }

  getServiceInfo() {
    return {
      name: 'Gongbu Bot Service',
      version: '1.0.0',
      description: 'Telegram Bot Management Service for educational courses',
      features: [
        'Dynamic bot creation for courses',
        'Course navigation and progress tracking',
        'Quiz and assignment handling',
        'WebApp integration',
        'Broadcasting and analytics',
      ],
      endpoints: {
        bots: '/bots',
        webhooks: '/bots/webhook/:botId',
        health: '/health',
        docs: '/api',
      },
    };
  }
}
