import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';

export const cacheConfig = async (
  configService: ConfigService,
): Promise<CacheModuleOptions> => {
  const redisUrl = configService.get<string>('REDIS_URL');
  
  if (redisUrl) {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      db: 0,
      ttl: 300, // 5 minutes
    };
  }

  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD'),
    db: configService.get<number>('REDIS_DB', 0),
    ttl: 300,
  };
};
