import { Global, Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: (configService: ConfigService) => {
        const client = new PrismaClient({
          datasources: {
            db: {
              url: configService.get<string>('DATABASE_URL'),
            },
          },
          log: configService.get('NODE_ENV') === 'development' 
            ? ['query', 'info', 'warn', 'error'] 
            : ['warn', 'error'],
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [PrismaClient],
})
export class PrismaModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly prisma: PrismaClient) {}

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
