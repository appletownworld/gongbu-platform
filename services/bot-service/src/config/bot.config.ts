import { ConfigService } from '@nestjs/config';

export interface BotConfig {
  token: string;
  webhookUrl?: string;
  webhookPath: string;
  webhookSecret?: string;
  username?: string;
  description: string;
  shortDescription: string;
  rateLimits: {
    messagesPerMinute: number;
    commandsPerMinute: number;
  };
  session: {
    ttl: number;
    cleanupInterval: number;
  };
  fileUpload: {
    maxSize: number;
    allowedTypes: string[];
  };
}

export const botConfig = (configService: ConfigService): BotConfig => ({
  token: configService.get<string>('TELEGRAM_BOT_TOKEN'),
  webhookUrl: configService.get<string>('TELEGRAM_BOT_WEBHOOK_URL'),
  webhookPath: configService.get<string>('TELEGRAM_BOT_WEBHOOK_PATH', '/webhook'),
  webhookSecret: configService.get<string>('TELEGRAM_BOT_WEBHOOK_SECRET'),
  username: configService.get<string>('BOT_USERNAME'),
  description: configService.get<string>('BOT_DESCRIPTION', 'Gongbu Learning Platform Bot'),
  shortDescription: configService.get<string>('BOT_SHORT_DESCRIPTION', 'AI-powered learning assistant'),
  rateLimits: {
    messagesPerMinute: configService.get<number>('BOT_RATE_LIMIT_MESSAGES_PER_MINUTE', 20),
    commandsPerMinute: configService.get<number>('BOT_RATE_LIMIT_COMMANDS_PER_MINUTE', 10),
  },
  session: {
    ttl: configService.get<number>('SESSION_TTL', 3600),
    cleanupInterval: configService.get<number>('SESSION_CLEANUP_INTERVAL', 300),
  },
  fileUpload: {
    maxSize: configService.get<number>('MAX_FILE_SIZE', 20 * 1024 * 1024),
    allowedTypes: configService.get<string>('ALLOWED_FILE_TYPES', 'image/*,audio/*,video/*,application/pdf').split(','),
  },
});
