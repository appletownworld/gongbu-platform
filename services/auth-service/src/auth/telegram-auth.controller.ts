import { Controller, Post, Body, Logger, HttpException, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TelegramLoginDto, TelegramLoginLegacyDto } from './dto/telegram-login.dto';


@ApiTags('telegram-auth')
@Controller('auth')
export class TelegramAuthController {
  private readonly logger = new Logger(TelegramAuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Secure Telegram WebApp authentication with HMAC validation',
    description: 'Authenticates or creates user using Telegram WebApp initData with HMAC signature validation for security.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            telegramId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string' },
            subscriptionPlan: { type: 'string' }
          }
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'HMAC validation failed or invalid Telegram data' 
  })
  async login(@Body() loginDto: TelegramLoginDto, @Req() req: any) {
    try {
      this.logger.log('🔐 Secure Telegram WebApp login attempt with HMAC validation');

      // Extract IP address
      const ipAddress = req.ip || req.connection?.remoteAddress || loginDto.ipAddress;
      
      // Authenticate with HMAC validation
      const result = await this.authService.authenticateOrCreateTelegramUser(
        loginDto.initData,
        loginDto.deviceInfo,
        ipAddress
      );

      this.logger.log(`✅ Secure authentication successful: ${result.user.firstName} (${result.user.role})`);

      return {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      };
    } catch (error) {
      this.logger.error('🚫 Secure Telegram login failed:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Secure Telegram authentication failed',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Post('telegram-login')
  @ApiOperation({
    summary: 'Legacy Telegram WebApp authentication (deprecated)',
    description: 'Legacy endpoint without HMAC validation. Use /auth/login instead for secure authentication.',
    deprecated: true
  })
  @ApiBody({
    description: 'Данные пользователя Telegram и initData для проверки',
    schema: {
      type: 'object',
      required: ['telegramUser', 'source'],
      properties: {
        telegramUser: {
          type: 'object',
          required: ['id', 'first_name'],
          properties: {
            id: { type: 'number', example: 123456789 },
            first_name: { type: 'string', example: 'Алексей' },
            last_name: { type: 'string', example: 'Шин' },
            username: { type: 'string', example: 'shinalex1' },
            language_code: { type: 'string', example: 'ru' },
            photo_url: { type: 'string', example: 'https://t.me/i/userpic/...' },
            is_premium: { type: 'boolean', example: false }
          }
        },
        initData: {
          type: 'object',
          properties: {
            query_id: { type: 'string' },
            auth_date: { type: 'number' },
            hash: { type: 'string' }
          }
        },
        source: {
          type: 'string',
          enum: ['webapp', 'bot'],
          example: 'webapp'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Успешная авторизация',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            telegramId: { type: 'number' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string', example: 'STUDENT' },
            subscription: { type: 'string', example: 'FREE' },
            isActive: { type: 'boolean' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные Telegram'
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь заблокирован'
  })
  async telegramLogin(@Body() loginDto: TelegramLoginLegacyDto) {
    try {
      this.logger.log(`🔐 Telegram авторизация для пользователя ${loginDto.telegramUser.id}`);
      
      // Валидация обязательных данных
      if (!loginDto.telegramUser?.id || !loginDto.telegramUser?.first_name) {
        throw new HttpException(
          'Отсутствуют обязательные данные пользователя Telegram',
          HttpStatus.BAD_REQUEST
        );
      }

      // Проверка безопасности (в продакшне проверяем hash)
      if (loginDto.source === 'webapp' && loginDto.initData?.hash) {
        const isValid = await this.validateTelegramData(
          loginDto.telegramUser,
          loginDto.initData
        );
        
        if (!isValid) {
          this.logger.warn(`❌ Неверная подпись Telegram данных для пользователя ${loginDto.telegramUser.id}`);
          throw new HttpException(
            'Неверная подпись данных Telegram',
            HttpStatus.UNAUTHORIZED
          );
        }
      }

      // Автоматическая регистрация/авторизация (Legacy without HMAC)
      const result = await this.authService.authenticateOrCreateTelegramUserLegacy({
        telegramId: loginDto.telegramUser.id,
        firstName: loginDto.telegramUser.first_name,
        lastName: loginDto.telegramUser.last_name,
        username: loginDto.telegramUser.username,
        languageCode: loginDto.telegramUser.language_code,
        photoUrl: loginDto.telegramUser.photo_url,
        authDate: loginDto.initData?.auth_date || Math.floor(Date.now() / 1000)
      });

      this.logger.log(`✅ Успешная авторизация пользователя: ${result.user.firstName} ${result.user.lastName || ''} (${result.user.role})`);

      return {
        user: {
          id: result.user.id,
          telegramId: result.user.telegramId,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          username: result.user.username,
          role: result.user.role,
          subscriptionPlan: result.user.subscriptionPlan
        },
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`❌ Ошибка Telegram авторизации: ${error.message}`, error.stack);
      
      throw new HttpException(
        'Внутренняя ошибка сервера авторизации',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Проверка подлинности данных Telegram WebApp
   * В продакшне здесь проверяется HMAC подпись
   */
  private async validateTelegramData(
    telegramUser: any,
    initData: any
  ): Promise<boolean> {
    try {
      // В development режиме пропускаем проверку
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug('🔧 Development режим - пропуск проверки подписи Telegram');
        return true;
      }

      // В продакшне проверяем HMAC с секретом бота
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN не настроен - пропуск проверки');
        return true;
      }

      // TODO: Реализовать проверку HMAC подписи
      // https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
      
      this.logger.debug('🔐 Проверка подписи Telegram данных (заглушка)');
      return true;

    } catch (error) {
      this.logger.error('❌ Ошибка проверки данных Telegram:', error);
      return false;
    }
  }
}
