import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TelegramOAuthService } from './telegram-oauth.service';
import { TelegramHmacValidatorService } from './telegram-hmac-validator.service';
import { JwtTokenService } from './jwt-token.service';
import { UserService } from '../users/user.service';
import { UserRepository } from '../users/user.repository';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';
import { PrismaModule } from '../config/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Core services
    AuthService,
    TelegramOAuthService,
    TelegramHmacValidatorService,
    JwtTokenService,
    UserService,
    UserRepository,
    
    // Guards
    JwtAuthGuard,
    RoleGuard,
  ],
  exports: [
    // Export services that might be used by other modules
    AuthService,
    JwtTokenService,
    UserService,
    JwtAuthGuard,
    RoleGuard,
  ],
})
export class AuthModule {}
