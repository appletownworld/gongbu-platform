import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

/**
 * SharedModule - Глобальный модуль для общих зависимостей
 * Решает проблему HttpService dependency injection во всех модулях
 */
@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  exports: [
    HttpModule,
    ConfigModule,
  ],
})
export class SharedModule {}
