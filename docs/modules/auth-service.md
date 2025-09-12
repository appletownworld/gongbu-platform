# Auth Service Module

**Сервис:** Authentication & Authorization Service  
**Порт:** 3001  
**Язык:** TypeScript + NestJS + Prisma  
**Статус:** Core Service  

---

## 📋 Обзор

Auth Service отвечает за аутентификацию пользователей через Telegram OAuth, управление профилями, системы ролей и подписками. Является критически важным сервисом для всей экосистемы.

## 🎯 Ответственности

### Основные функции
- **Telegram OAuth** - авторизация пользователей через Telegram Web App
- **JWT Token Management** - создание, валидация и обновление токенов
- **User Profile Management** - управление профилями пользователей
- **Role & Permission System** - система ролей и разрешений
- **Subscription Management** - управление подписками пользователей
- **Account Verification** - верификация аккаунтов создателей

### Дополнительные функции
- **2FA Integration** - двухфакторная аутентификация (для создателей)
- **Session Management** - управление пользовательскими сессиями
- **Password Reset** - восстановление доступа (для email аккаунтов)
- **Account Linking** - связывание Telegram с другими аккаунтами

## 🏗️ Database Schema

### User Entity
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Role & Status
    role user_role NOT NULL DEFAULT 'student',
    status user_status NOT NULL DEFAULT 'active',
    is_verified BOOLEAN DEFAULT false,
    
    -- Subscription
    subscription_plan subscription_plan DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    subscription_canceled_at TIMESTAMP,
    
    -- Settings
    language VARCHAR(10) DEFAULT 'ru',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{}',
    
    -- Metadata
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription ON users(subscription_plan);
```

### Sessions Entity
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(refresh_token)
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
```

### Permissions System
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(role, permission_id)
);

-- Базовые разрешения
INSERT INTO permissions (name, resource, action, description) VALUES
('course:read', 'course', 'read', 'Просмотр курсов'),
('course:create', 'course', 'create', 'Создание курсов'),
('course:update', 'course', 'update', 'Редактирование курсов'),
('course:delete', 'course', 'delete', 'Удаление курсов'),
('user:read', 'user', 'read', 'Просмотр профилей'),
('user:update', 'user', 'update', 'Редактирование профилей'),
('admin:all', 'admin', 'all', 'Все административные действия');
```

## 📡 API Endpoints

### Authentication
```yaml
POST /auth/telegram
  description: Авторизация через Telegram Web App
  body: {
    initData: string,      # Telegram WebApp initData
    hash: string,          # Telegram hash для валидации
    startParam?: string    # Deep link параметр
  }
  response: {
    accessToken: string,   # JWT access token (15 мин)
    refreshToken: string,  # Refresh token (30 дней)
    user: UserProfile,
    expiresIn: number
  }

POST /auth/refresh  
  description: Обновление access токена
  body: {
    refreshToken: string
  }
  response: {
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  }

POST /auth/logout
  description: Выход из системы
  headers: { Authorization: Bearer <token> }
  body: {
    refreshToken?: string,  # Для выхода из конкретной сессии
    allSessions?: boolean   # Для выхода из всех сессий
  }
  response: { success: boolean }

GET /auth/me
  description: Получение информации о текущем пользователе
  headers: { Authorization: Bearer <token> }
  response: UserProfile
```

### User Management
```yaml
GET /users/profile
  description: Получение своего профиля
  headers: { Authorization: Bearer <token> }
  response: UserProfile

PUT /users/profile
  description: Обновление профиля
  headers: { Authorization: Bearer <token> }
  body: {
    first_name?: string,
    last_name?: string,
    email?: string,
    phone?: string,
    language?: string,
    timezone?: string,
    notification_preferences?: object
  }
  response: UserProfile

POST /users/verify-email
  description: Отправка письма для верификации email
  headers: { Authorization: Bearer <token> }
  body: { email: string }
  response: { message: string }

POST /users/confirm-email
  description: Подтверждение email
  body: { 
    token: string,   # Токен из письма
    code: string     # 6-значный код
  }
  response: { success: boolean }

POST /users/upgrade
  description: Обновление подписки
  headers: { Authorization: Bearer <token> }
  body: {
    plan: 'professional' | 'enterprise',
    paymentMethod: 'telegram' | 'stripe',
    billingPeriod: 'monthly' | 'yearly'
  }
  response: {
    paymentUrl: string,
    subscriptionId: string
  }
```

### Admin Endpoints  
```yaml
GET /admin/users
  description: Список всех пользователей (только админы)
  headers: { Authorization: Bearer <admin-token> }
  query: {
    page?: number,
    limit?: number,
    role?: string,
    status?: string,
    search?: string
  }
  response: {
    users: UserProfile[],
    total: number,
    page: number,
    pages: number
  }

PUT /admin/users/:userId/role
  description: Изменение роли пользователя
  headers: { Authorization: Bearer <admin-token> }
  params: { userId: string }
  body: { role: 'student' | 'creator' | 'admin' }
  response: UserProfile

POST /admin/users/:userId/ban
  description: Блокировка пользователя
  headers: { Authorization: Bearer <admin-token> }
  params: { userId: string }
  body: { 
    reason: string,
    duration?: number  # Дни блокировки, null = навсегда
  }
  response: { success: boolean }
```

## 🔐 JWT Token Structure

### Access Token Payload
```typescript
interface AccessTokenPayload {
  sub: string;                    // User ID
  telegram_id: number;
  email?: string;
  role: UserRole;
  subscription_plan: SubscriptionPlan;
  permissions: string[];
  session_id: string;
  
  // Standard JWT claims
  iat: number;                    // Issued at
  exp: number;                    // Expires at (15 минут)
  iss: string;                    // Issuer (gongbu.app)
  aud: string;                    // Audience (gongbu-api)
}

// Генерация токена
@Injectable()
export class TokenService {
  generateAccessToken(user: User, sessionId: string): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      telegram_id: user.telegram_id,
      email: user.email,
      role: user.role,
      subscription_plan: user.subscription_plan,
      permissions: this.getUserPermissions(user.role),
      session_id: sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 минут
      iss: 'gongbu.app',
      aud: 'gongbu-api'
    };

    return this.jwtService.sign(payload);
  }
}
```

### Refresh Token
```typescript
interface RefreshTokenPayload {
  sub: string;                    // User ID  
  session_id: string;
  type: 'refresh';
  
  iat: number;
  exp: number;                    // 30 дней
  iss: string;
  aud: string;
}

// Refresh token хранится в БД с дополнительными метаданными
interface SessionRecord {
  id: string;
  user_id: string;
  refresh_token: string;         // Хешированный refresh token
  device_info: {
    platform: string;
    browser: string;
    version: string;
  };
  ip_address: string;
  expires_at: Date;
  last_used_at: Date;
}
```

## 🔑 Telegram Authentication

### WebApp Data Validation
```typescript
@Injectable()
export class TelegramAuthService {
  validateWebAppData(initData: string, hash: string): TelegramUser | null {
    // Парсинг initData
    const urlParams = new URLSearchParams(initData);
    const dataToCheck: string[] = [];
    
    // Сортировка параметров (кроме hash)
    for (const [key, value] of urlParams.entries()) {
      if (key !== 'hash') {
        dataToCheck.push(`${key}=${value}`);
      }
    }
    
    dataToCheck.sort();
    const dataCheckString = dataToCheck.join('\n');
    
    // Создание secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();
    
    // Проверка подписи
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    if (computedHash !== hash) {
      throw new UnauthorizedException('Invalid Telegram data');
    }

    // Парсинг пользователя
    const userParam = urlParams.get('user');
    if (!userParam) {
      throw new BadRequestException('User data not found');
    }

    return JSON.parse(userParam);
  }

  async authenticateOrCreateUser(telegramUser: TelegramUser): Promise<User> {
    // Поиск существующего пользователя
    let user = await this.userRepository.findByTelegramId(telegramUser.id);

    if (!user) {
      // Создание нового пользователя
      user = await this.userRepository.create({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        avatar_url: telegramUser.photo_url,
        language: telegramUser.language_code || 'ru',
        role: 'student',
        subscription_plan: 'free'
      });

      // Событие для аналитики
      await this.eventBus.publish(new UserRegisteredEvent(user));
    } else {
      // Обновление данных пользователя
      await this.userRepository.update(user.id, {
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        avatar_url: telegramUser.photo_url,
        last_login_at: new Date(),
        login_count: user.login_count + 1
      });
    }

    return user;
  }
}
```

## 🛡️ Security Features

### Rate Limiting
```typescript
// Специфичные лимиты для Auth Service
export const authRateLimits = {
  login: {
    windowMs: 15 * 60 * 1000,     // 15 минут
    max: 10,                      // 10 попыток входа
    skipSuccessfulRequests: true,
    keyGenerator: (req) => req.ip + ':' + (req.body?.telegram_id || 'anonymous')
  },
  
  refresh: {
    windowMs: 5 * 60 * 1000,      // 5 минут  
    max: 20,                      // 20 обновлений токена
    keyGenerator: (req) => req.body?.refreshToken?.substring(0, 10) || req.ip
  },

  emailVerification: {
    windowMs: 60 * 60 * 1000,     // 1 час
    max: 3,                       // 3 письма верификации
    keyGenerator: (req) => req.user?.id + ':email-verify'
  }
};
```

### Session Security
```typescript
@Injectable()
export class SessionService {
  async createSession(user: User, deviceInfo: any, ipAddress: string): Promise<string> {
    // Ограничение на количество активных сессий
    const maxSessions = user.role === 'admin' ? 10 : 5;
    const activeSessions = await this.sessionRepository.findActiveByUserId(user.id);
    
    if (activeSessions.length >= maxSessions) {
      // Удаление самой старой сессии
      const oldestSession = activeSessions.sort((a, b) => 
        a.last_used_at.getTime() - b.last_used_at.getTime()
      )[0];
      
      await this.sessionRepository.delete(oldestSession.id);
    }

    // Создание новой сессии
    const refreshToken = this.generateSecureToken();
    const session = await this.sessionRepository.create({
      user_id: user.id,
      refresh_token: await this.hashToken(refreshToken),
      device_info: deviceInfo,
      ip_address: ipAddress,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней
    });

    return refreshToken;
  }

  async validateSession(refreshToken: string): Promise<User | null> {
    const hashedToken = await this.hashToken(refreshToken);
    const session = await this.sessionRepository.findByRefreshToken(hashedToken);
    
    if (!session || session.expires_at < new Date()) {
      return null;
    }

    // Обновление времени использования
    await this.sessionRepository.updateLastUsed(session.id);
    
    return this.userRepository.findById(session.user_id);
  }
}
```

## 📊 Events & Integration

### Domain Events
```typescript
// События для других сервисов
export class UserRegisteredEvent {
  constructor(
    public readonly user: User,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserRoleChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly oldRole: UserRole,
    public readonly newRole: UserRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class SubscriptionUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly oldPlan: SubscriptionPlan,
    public readonly newPlan: SubscriptionPlan,
    public readonly timestamp: Date = new Date()
  ) {}
}

// Event handlers
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler {
  constructor(private notificationService: NotificationService) {}

  async handle(event: UserRegisteredEvent) {
    // Отправка приветственного уведомления
    await this.notificationService.sendWelcomeMessage(event.user);
    
    // Создание начальной статистики
    await this.analyticsService.trackUserRegistration(event.user);
  }
}
```

### Service Integration
```typescript
// Клиент для других сервисов
@Injectable()
export class UserServiceClient {
  constructor(
    @Inject('COURSE_SERVICE') private courseService: ClientProxy,
    @Inject('PAYMENT_SERVICE') private paymentService: ClientProxy
  ) {}

  async notifyUserCreated(user: User): Promise<void> {
    // Уведомление Course Service о новом пользователе
    await this.courseService.emit('user.created', {
      userId: user.id,
      role: user.role,
      subscriptionPlan: user.subscription_plan
    });

    // Создание кошелька в Payment Service  
    if (user.role === 'creator') {
      await this.paymentService.emit('wallet.create', {
        userId: user.id,
        currency: 'RUB'
      });
    }
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('TelegramAuthService', () => {
  describe('validateWebAppData', () => {
    it('should validate correct Telegram data', () => {
      const service = new TelegramAuthService();
      const initData = 'user=%7B%22id%22%3A123456789%7D&hash=valid_hash';
      
      const result = service.validateWebAppData(initData, 'expected_hash');
      expect(result).toBeDefined();
      expect(result.id).toBe(123456789);
    });

    it('should reject invalid hash', () => {
      const service = new TelegramAuthService();
      const initData = 'user=%7B%22id%22%3A123456789%7D';
      
      expect(() => 
        service.validateWebAppData(initData, 'invalid_hash')
      ).toThrow(UnauthorizedException);
    });
  });
});

describe('TokenService', () => {
  it('should generate valid JWT tokens', () => {
    const service = new TokenService(jwtService);
    const user = createMockUser();
    
    const token = service.generateAccessToken(user, 'session-id');
    const decoded = jwtService.verify(token);
    
    expect(decoded.sub).toBe(user.id);
    expect(decoded.role).toBe(user.role);
  });
});
```

### Integration Tests
```typescript
describe('Auth Controller (e2e)', () => {
  it('/auth/telegram (POST)', () => {
    const telegramData = createValidTelegramData();
    
    return request(app)
      .post('/auth/telegram')
      .send(telegramData)
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.telegram_id).toBe(telegramData.user.id);
      });
  });

  it('/auth/me (GET) should require authentication', () => {
    return request(app)
      .get('/auth/me')
      .expect(401);
  });
});
```

## 📋 Implementation Checklist

### Phase 1: Basic Auth
- [ ] Telegram WebApp data validation
- [ ] JWT token generation and validation  
- [ ] Basic user CRUD operations
- [ ] Session management
- [ ] Database schema and migrations

### Phase 2: Advanced Features
- [ ] Role and permission system
- [ ] Email verification
- [ ] Password reset functionality
- [ ] 2FA for creators
- [ ] Account linking

### Phase 3: Security & Performance
- [ ] Rate limiting implementation
- [ ] Security headers and CORS
- [ ] Token blacklisting
- [ ] Brute force protection
- [ ] Audit logging

### Phase 4: Integration
- [ ] Event system setup
- [ ] Service-to-service communication
- [ ] Webhook endpoints
- [ ] Analytics integration
- [ ] Notification triggers

### Phase 5: Production
- [ ] Performance optimization
- [ ] Monitoring and alerting
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation

---

## 🔗 Dependencies

### Internal Services
- Notification Service (welcome messages, alerts)
- Analytics Service (user events tracking)
- Payment Service (wallet creation for creators)

### External Dependencies
- PostgreSQL (user data)
- Redis (session storage, rate limiting)
- Telegram Bot API (user data validation)
- Email service (verification emails)

### Libraries
- `@nestjs/jwt` - JWT token handling
- `@nestjs/passport` - Authentication strategies
- `bcrypt` - Password hashing
- `@prisma/client` - Database ORM
- `express-rate-limit` - Rate limiting
