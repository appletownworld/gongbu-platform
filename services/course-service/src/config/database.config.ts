import { ConfigService } from '@nestjs/config';

export const databaseConfig = (configService: ConfigService) => ({
  url: configService.get<string>('DATABASE_URL'),
});

export interface DatabaseConfig {
  url: string;
}
