# API Gateway Module

**Сервис:** API Gateway  
**Порт:** 3000  
**Язык:** TypeScript + NestJS  
**Статус:** Core Infrastructure  

---

## 📋 Обзор

API Gateway служит единой точкой входа для всех клиентов (Web App, Mini-App, мобильные приложения). Отвечает за маршрутизацию, аутентификацию, rate limiting и безопасность.

## 🎯 Ответственности

### Основные функции
- **Request Routing** - маршрутизация запросов к соответствующим микросервисам
- **Authentication** - проверка JWT токенов и Telegram OAuth
- **Authorization** - контроль доступа на базе ролей и разрешений
- **Rate Limiting** - защита от спама и DDoS атак
- **CORS** - настройка политик безопасности
- **Request/Response Transformation** - модификация запросов при необходимости
- **Circuit Breaker** - защита от недоступности downstream сервисов
- **Metrics Collection** - сбор метрик производительности

### Безопасность
- **JWT Token Validation** - проверка подписи и срока действия токенов
- **API Key Management** - управление ключами для внешних интеграций  
- **Request Sanitization** - очистка входящих данных
- **SSL Termination** - обработка HTTPS соединений

## 🏗️ Архитектура

### Компоненты
```
┌─────────────────────────────────────────────┐
│              API Gateway                    │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐          │
│  │   Auth      │  │   Rate      │          │
│  │ Middleware  │  │ Limiter     │          │  
│  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐          │
│  │   Route     │  │   Circuit   │          │
│  │  Handler    │  │  Breaker    │          │
│  └─────────────┘  └─────────────┘          │
│  ┌─────────────────────────────────────────┐│
│  │          Proxy Engine                  ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### Middleware Stack
```typescript
// Порядок выполнения middleware
app.use(corsMiddleware);
app.use(helmetMiddleware); // Security headers
app.use(rateLimitMiddleware);
app.use(authMiddleware);
app.use(loggingMiddleware);
app.use(metricsMiddleware);
app.use(proxyMiddleware);
```

## 📡 API Endpoints

### Health Check
```yaml
GET /health
  response: {
    status: "ok" | "error",
    timestamp: string,
    services: {
      auth: "up" | "down",
      course: "up" | "down", 
      bot: "up" | "down",
      // ... другие сервисы
    }
  }

GET /metrics
  response: Prometheus metrics format
```

### Proxy Routes
```yaml
# Authentication routes
POST /auth/* -> http://auth-service:3001/auth/*
GET /users/* -> http://auth-service:3001/users/*

# Course management
GET /courses/* -> http://course-service:3002/courses/*
POST /courses/* -> http://course-service:3002/courses/*
PUT /courses/* -> http://course-service:3002/courses/*
DELETE /courses/* -> http://course-service:3002/courses/*

# Bot management  
GET /bots/* -> http://bot-service:3003/bots/*
POST /bots/* -> http://bot-service:3003/bots/*

# Payments
POST /payments/* -> http://payment-service:3004/payments/*
GET /payments/* -> http://payment-service:3004/payments/*

# Plugins
GET /plugins/* -> http://plugin-service:3005/plugins/*
POST /plugins/* -> http://plugin-service:3005/plugins/*

# Notifications
POST /notifications/* -> http://notification-service:3006/notifications/*

# Analytics (read-only через gateway)
GET /analytics/* -> http://analytics-service:3007/analytics/*
```

## 🔐 Authentication & Authorization

### JWT Token Flow
```typescript
interface JWTPayload {
  userId: string;
  telegramId: number;
  role: 'student' | 'creator' | 'admin';
  subscriptionPlan: 'free' | 'professional' | 'enterprise';
  permissions: string[];
  exp: number;
  iat: number;
}

// Middleware для проверки токена
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);
    
    if (!token) {
      throw new UnauthorizedException('Token required');
    }

    try {
      const payload = await this.jwtService.verify(token);
      req.user = payload;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### Permission-based Access Control
```typescript
// Декораторы для контроля доступа
@Controller()
@UseGuards(JwtAuthGuard)
export class CourseController {
  
  @Get('/courses')
  @Permissions('course:read')
  getCourses() {
    // Доступно всем авторизованным пользователям
  }

  @Post('/courses')
  @Permissions('course:create')
  @RequireRole('creator', 'admin')
  createCourse() {
    // Только создатели курсов и админы
  }

  @Delete('/courses/:id')
  @Permissions('course:delete')
  @RequireRole('admin')
  deleteCourse() {
    // Только админы
  }
}
```

## 📊 Rate Limiting

### Стратегии лимитирования
```typescript
// Конфигурация rate limiting
const rateLimitConfig = {
  // Общий лимит по IP
  global: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 1000, // максимум запросов
    message: 'Too many requests from this IP'
  },

  // Лимиты для авторизованных пользователей  
  authenticated: {
    windowMs: 15 * 60 * 1000,
    max: 5000, // больше лимит для auth пользователей
  },

  // Специальные лимиты для создателей
  creators: {
    windowMs: 15 * 60 * 1000,
    max: 10000,
  },

  // Лимиты по эндпоинтам
  endpoints: {
    '/auth/login': {
      windowMs: 15 * 60 * 1000,
      max: 10, // только 10 попыток логина
    },
    '/courses': {
      windowMs: 60 * 1000,
      max: 100,
    }
  }
};
```

## 🔄 Circuit Breaker

### Защита от недоступности сервисов
```typescript
@Injectable()
export class CircuitBreakerService {
  private breakers = new Map<string, CircuitBreaker>();

  constructor() {
    // Конфигурация для каждого сервиса
    this.setupBreaker('auth-service', {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    });

    this.setupBreaker('course-service', {
      timeout: 5000,
      errorThresholdPercentage: 60,
      resetTimeout: 60000,
    });
  }

  async callService(serviceName: string, request: () => Promise<any>) {
    const breaker = this.breakers.get(serviceName);
    return breaker.fire(request);
  }
}

// Использование в proxy middleware
export class ProxyMiddleware {
  async proxyRequest(serviceName: string, request: Request) {
    try {
      return await this.circuitBreaker.callService(serviceName, () => 
        this.httpClient.forward(request)
      );
    } catch (error) {
      if (error.name === 'OpenCircuitError') {
        throw new ServiceUnavailableException(`${serviceName} temporarily unavailable`);
      }
      throw error;
    }
  }
}
```

## 📈 Метрики и мониторинг

### Prometheus метрики
```typescript
// Основные метрики
export const gatewayMetrics = {
  httpRequestsTotal: new Counter({
    name: 'gateway_http_requests_total',
    help: 'Total HTTP requests through gateway',
    labelNames: ['method', 'route', 'status', 'service']
  }),

  httpRequestDuration: new Histogram({
    name: 'gateway_http_request_duration_seconds', 
    help: 'HTTP request duration through gateway',
    labelNames: ['method', 'route', 'service'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  serviceHealthStatus: new Gauge({
    name: 'gateway_service_health',
    help: 'Health status of downstream services',
    labelNames: ['service']
  }),

  activeConnections: new Gauge({
    name: 'gateway_active_connections',
    help: 'Number of active connections'
  }),

  rateLimitHits: new Counter({
    name: 'gateway_rate_limit_hits_total',
    help: 'Number of rate limit violations',
    labelNames: ['ip', 'endpoint']
  })
};

// Middleware для сбора метрик
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      
      gatewayMetrics.httpRequestsTotal
        .labels(req.method, req.path, res.statusCode.toString(), 'gateway')
        .inc();

      gatewayMetrics.httpRequestDuration
        .labels(req.method, req.path, 'gateway')
        .observe(duration);
    });

    next();
  }
}
```

## 🚀 Deployment

### Environment Variables
```bash
# Основные настройки
NODE_ENV=production
PORT=3000
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://redis:6379

# Downstream services
AUTH_SERVICE_URL=http://auth-service:3001
COURSE_SERVICE_URL=http://course-service:3002
BOT_SERVICE_URL=http://bot-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3004
PLUGIN_SERVICE_URL=http://plugin-service:3005
NOTIFICATION_SERVICE_URL=http://notification-service:3006
ANALYTICS_SERVICE_URL=http://analytics-service:3007

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Circuit breaker
CIRCUIT_BREAKER_TIMEOUT=5000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000

# CORS settings
CORS_ORIGIN=https://gongbu.app,https://mini-app.gongbu.app
CORS_CREDENTIALS=true
```

### Docker Configuration
```dockerfile
# Dockerfile.prod
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

USER node

CMD ["node", "dist/main.js"]
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Тестирование middleware
describe('AuthMiddleware', () => {
  it('should allow requests with valid token', async () => {
    const middleware = new AuthMiddleware(jwtService);
    const req = createMockRequest({ 
      headers: { authorization: 'Bearer valid-token' } 
    });
    
    await expect(middleware.use(req, res, next)).resolves.not.toThrow();
    expect(req.user).toBeDefined();
  });

  it('should reject requests with invalid token', async () => {
    const middleware = new AuthMiddleware(jwtService);
    const req = createMockRequest({ 
      headers: { authorization: 'Bearer invalid-token' } 
    });
    
    await expect(middleware.use(req, res, next))
      .rejects.toThrow(UnauthorizedException);
  });
});
```

### Integration Tests
```typescript
// Тестирование proxy функциональности
describe('API Gateway Integration', () => {
  it('should proxy course requests to course service', async () => {
    const response = await request(app)
      .get('/courses')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(mockCourseService.getCourses).toHaveBeenCalled();
  });

  it('should handle service unavailability with circuit breaker', async () => {
    mockCourseService.getCourses.mockRejectedValue(new Error('Service down'));

    await request(app)
      .get('/courses')
      .set('Authorization', 'Bearer valid-token')
      .expect(503);
  });
});
```

## 📋 Implementation Checklist

### Phase 1: Core Setup
- [ ] NestJS project initialization
- [ ] Basic HTTP server setup
- [ ] Health check endpoint
- [ ] Basic logging setup
- [ ] Docker configuration

### Phase 2: Authentication
- [ ] JWT middleware implementation
- [ ] Telegram OAuth integration  
- [ ] Role-based access control
- [ ] Permission system
- [ ] Auth endpoint testing

### Phase 3: Routing & Proxy
- [ ] Service registry setup
- [ ] HTTP proxy middleware
- [ ] Request/response transformation
- [ ] Error handling and retries
- [ ] Circuit breaker implementation

### Phase 4: Security & Performance  
- [ ] Rate limiting implementation
- [ ] CORS configuration
- [ ] Request sanitization
- [ ] SSL/TLS configuration
- [ ] Performance optimization

### Phase 5: Monitoring & Analytics
- [ ] Prometheus metrics
- [ ] Request logging
- [ ] Service health monitoring  
- [ ] Alerting setup
- [ ] Dashboard creation

### Phase 6: Production Readiness
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation completion
- [ ] Deployment automation
- [ ] Monitoring setup

---

## 🔗 Dependencies

### Internal Services
- Auth Service (health check, user validation)
- Course Service (course data proxy)
- Bot Service (bot management proxy)  
- Payment Service (payment processing proxy)
- Plugin Service (plugin marketplace proxy)
- Notification Service (notification proxy)
- Analytics Service (analytics data proxy)

### External Dependencies
- Redis (session storage, rate limiting)
- Prometheus (metrics collection)
- JWT library (token validation)
- HTTP proxy library (request forwarding)

### Development Dependencies
- Jest (testing)
- Supertest (API testing)
- Mock servers для integration tests
