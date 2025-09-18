import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig = async (
  configService: ConfigService,
): Promise<ThrottlerModuleOptions> => ({
  throttlers: [
    {
      ttl: configService.get<number>('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
      limit: configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 1000),
    },
  ],
});
