import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => {
        const prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
          errorFormat: 'pretty',
        });

        // Connect to database
        return prisma.$connect().then(() => {
          console.log('✅ Course Service connected to database');
          return prisma;
        }).catch((error) => {
          console.error('❌ Course Service database connection failed:', error);
          process.exit(1);
        });
      },
    },
  ],
  exports: [PrismaClient],
})
export class PrismaModule {
  static forRoot() {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PrismaClient,
          useFactory: () => {
            const prisma = new PrismaClient({
              log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
              errorFormat: 'pretty',
            });

            return prisma.$connect().then(() => {
              console.log('✅ Course Service connected to database');
              return prisma;
            }).catch((error) => {
              console.error('❌ Course Service database connection failed:', error);
              process.exit(1);
            });
          },
        },
      ],
      exports: [PrismaClient],
      global: true,
    };
  }
}
