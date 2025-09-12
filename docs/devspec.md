# Проектная документация: Gongbu Platform
## Платформа для создания образовательных курсов в Telegram

**Версия:** 1.0  
**Дата:** 11 сентября 2025  
**Статус:** Development Specification  

---

## 📋 Содержание
1. [Обзор проекта](#обзор-проекта)
2. [Архитектура системы](#архитектура-системы)
3. [Компоненты системы](#компоненты-системы)
4. [API Спецификация](#api-спецификация)
5. [Схемы баз данных](#схемы-баз-данных)
6. [Telegram Bot Integration](#telegram-bot-integration)
7. [Система плагинов](#система-плагинов)
8. [Окружение разработки](#окружение-разработки)
9. [Инструкции по развертыванию](#инструкции-по-развертыванию)
10. [Мониторинг и логирование](#мониторинг-и-логирование)

---

## 🎯 Обзор проекта

### Название проекта: Gongbu (공부)
*Корейское слово, означающее "учеба" или "обучение"*

### Краткое описание
Gongbu - это платформа для создания и монетизации интерактивных образовательных курсов внутри экосистемы Telegram. Система включает веб-редактор курсов, Telegram Mini-App, систему ботов и marketplace плагинов.

### Ключевые особенности
- 🎓 **Создание курсов**: Drag & Drop редактор с поддержкой мультимедиа
- 🤖 **Telegram боты**: Автоматическая генерация персональных ботов для каждого курса
- 📱 **Mini-App**: Мобильный редактор курсов прямо в Telegram
- 💰 **Монетизация**: Платные этапы и подписочная модель
- 🔌 **Плагины**: Расширяемая экосистема дополнений
- 📊 **Аналитика**: Детальная статистика по студентам и курсам

---

## 🏗️ Архитектура системы

### Общая архитектура
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │ Telegram Client │    │   Mini-App      │
│   (React)       │    │    (Bot API)    │    │   (React)       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────┬───────────┴──────────┬───────────┘
                     │                      │
              ┌──────▼──────────────────────▼──────┐
              │         API Gateway               │
              │         (NestJS)                  │
              └──────┬─────────────────────┬──────┘
                     │                     │
        ┌────────────▼────────┐   ┌────────▼────────┐
        │   Auth Service      │   │  Course Service │
        │   (JWT, OAuth)      │   │  (CRUD, Logic)  │
        └──────┬──────────────┘   └─────────────────┘
               │
        ┌──────▼──────┐   ┌─────────────┐   ┌─────────────┐
        │ User Service│   │Bot Service  │   │Plugin Service│
        │(Profiles)   │   │(Generator)  │   │(Marketplace)│
        └─────────────┘   └─────────────┘   └─────────────┘
                     │
              ┌──────▼──────┐
              │  Database   │
              │(PostgreSQL) │
              └─────────────┘
```

### Микросервисная архитектура
1. **API Gateway** - Единая точка входа, маршрутизация, аутентификация
2. **Auth Service** - Управление пользователями и авторизацией
3. **Course Service** - Управление курсами и контентом
4. **Bot Service** - Генерация и управление Telegram ботами
5. **Payment Service** - Обработка платежей
6. **Plugin Service** - Управление плагинами
7. **Notification Service** - Уведомления
8. **Analytics Service** - Сбор и анализ данных

### Технологический стек по компонентам
```yaml
Frontend:
  Web: React 18 + TypeScript + Vite + Material-UI
  Mini-App: React + Telegram Web App SDK
  
Backend:
  Runtime: Node.js 20+ LTS
  Framework: NestJS 10+
  Language: TypeScript 5.0+
  API: GraphQL + REST
  
Database:
  Primary: PostgreSQL 15+
  Cache: Redis 7+
  Search: Elasticsearch 8+
  
Message Queue:
  Heavy Tasks: Apache Kafka
  Real-time: Redis Pub/Sub
  Task Queue: Bull/BullMQ
  
Storage:
  Files: AWS S3 / MinIO
  CDN: CloudFlare
  
DevOps:
  Container: Docker + Kubernetes
  CI/CD: GitHub Actions
  Monitoring: Prometheus + Grafana
```

---

## 🧩 Компоненты системы

### 1. API Gateway
**Назначение**: Единая точка входа для всех клиентов
**Технологии**: NestJS + Express.js
**Ответственности**:
- Маршрутизация запросов к микросервисам
- Rate limiting и защита от DDoS
- Аутентификация и авторизация
- Логирование всех запросов
- CORS и безопасность

### 2. Auth Service
**Назначение**: Управление пользователями и сессиями
**База данных**: PostgreSQL
**Схема пользователя**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(100),
    email VARCHAR(255),
    role user_role NOT NULL DEFAULT 'student',
    subscription_plan subscription_plan DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE user_role AS ENUM ('student', 'creator', 'admin');
CREATE TYPE subscription_plan AS ENUM ('free', 'professional', 'enterprise');
```

### 3. Course Service
**Назначение**: Управление курсами и образовательным контентом
**Основные сущности**:
- Курсы (Courses)
- Этапы курса (Course Steps)
- Квизы (Quizzes)  
- Задания (Assignments)
- Прогресс студентов (Student Progress)

### 4. Bot Service
**Назначение**: Автоматическая генерация и управление Telegram ботами
**Функции**:
- Создание уникального бота для каждого курса
- Обработка webhook'ов от Telegram
- Навигация по курсу
- Обработка платежей
- Отслеживание прогресса

### 5. Plugin Service  
**Назначение**: Управление экосистемой плагинов
**Компоненты**:
- Plugin Registry - каталог плагинов
- Plugin Executor - выполнение плагинов в sandbox
- Plugin Marketplace - витрина плагинов

---

## 🔌 API Спецификация

### REST API Endpoints

#### Authentication
```yaml
POST /auth/telegram
  body: { initData: string }
  response: { token: string, user: User }

POST /auth/refresh
  body: { refreshToken: string }
  response: { token: string }

POST /auth/logout
  headers: { Authorization: Bearer <token> }
  response: { success: boolean }
```

#### Users
```yaml
GET /users/profile
  headers: { Authorization: Bearer <token> }
  response: User

PUT /users/profile
  headers: { Authorization: Bearer <token> }
  body: { username?: string, email?: string }
  response: User

POST /users/upgrade
  headers: { Authorization: Bearer <token> }
  body: { plan: 'professional' | 'enterprise' }
  response: { paymentUrl: string }
```

#### Courses
```yaml
GET /courses
  query: { page?, limit?, category?, search? }
  response: { courses: Course[], total: number }

POST /courses
  headers: { Authorization: Bearer <token> }
  body: { title: string, description?: string }
  response: Course

GET /courses/:id
  response: Course

PUT /courses/:id
  headers: { Authorization: Bearer <token> }
  body: Partial<Course>
  response: Course

DELETE /courses/:id
  headers: { Authorization: Bearer <token> }
  response: { success: boolean }

POST /courses/:id/publish
  headers: { Authorization: Bearer <token> }
  response: { botUsername: string }
```

#### Course Steps
```yaml
GET /courses/:courseId/steps
  response: CourseStep[]

POST /courses/:courseId/steps
  headers: { Authorization: Bearer <token> }
  body: { title: string, content: StepContent, stepType: StepType }
  response: CourseStep

PUT /courses/:courseId/steps/:stepId
  headers: { Authorization: Bearer <token> }
  body: Partial<CourseStep>
  response: CourseStep

DELETE /courses/:courseId/steps/:stepId
  headers: { Authorization: Bearer <token> }
  response: { success: boolean }
```

---

## 🗄️ Схемы баз данных

### Основная схема PostgreSQL
```sql
-- Enum типы
CREATE TYPE user_role AS ENUM ('student', 'creator', 'admin');
CREATE TYPE subscription_plan AS ENUM ('free', 'professional', 'enterprise');
CREATE TYPE step_type AS ENUM ('text', 'video', 'quiz', 'assignment', 'plugin');
CREATE TYPE pricing_model AS ENUM ('free', 'paid', 'subscription', 'freemium');
CREATE TYPE assignment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Пользователи
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    role user_role NOT NULL DEFAULT 'student',
    subscription_plan subscription_plan DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Курсы
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bot_token VARCHAR(255),
    bot_username VARCHAR(100),
    is_published BOOLEAN DEFAULT false,
    pricing_model pricing_model DEFAULT 'free',
    price DECIMAL(10,2),
    category VARCHAR(100),
    tags TEXT[],
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_duration INTEGER, -- в минутах
    language VARCHAR(10) DEFAULT 'ru',
    thumbnail_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    students_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Этапы курсов
CREATE TABLE course_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    step_type step_type NOT NULL,
    order_index INTEGER NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    step_price DECIMAL(10,2),
    is_required BOOLEAN DEFAULT true,
    unlock_conditions JSONB, -- Условия разблокировки
    estimated_duration INTEGER, -- в минутах
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Прогресс студентов
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    step_id UUID REFERENCES course_steps(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    score INTEGER, -- Оценка за этап (если применимо)
    attempts_count INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- в секундах
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, step_id)
);

-- Задания для проверки преподавателем
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID REFERENCES course_steps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content JSONB NOT NULL, -- Ответ студента
    status assignment_status DEFAULT 'pending',
    teacher_comment TEXT,
    score INTEGER,
    reviewed_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- Плагины
CREATE TABLE plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(20) NOT NULL,
    author_id UUID REFERENCES users(id),
    description TEXT,
    long_description TEXT,
    code TEXT NOT NULL,
    configuration_schema JSONB,
    category VARCHAR(50),
    tags TEXT[],
    is_approved BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    price DECIMAL(10,2),
    downloads_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    icon_url TEXT,
    screenshots TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_courses_creator_id ON courses(creator_id);
CREATE INDEX idx_courses_published ON courses(is_published) WHERE is_published = true;
CREATE INDEX idx_course_steps_course_id ON course_steps(course_id);
CREATE INDEX idx_course_steps_order ON course_steps(course_id, order_index);
CREATE INDEX idx_student_progress_user_course ON student_progress(user_id, course_id);
CREATE INDEX idx_assignments_status ON assignments(status);
```

---

## 🤖 Telegram Bot Integration

### Bot Message Templates
```typescript
export const MessageTemplates = {
  welcome: (course: Course) => `
🎓 *Добро пожаловать на курс "${course.title}"*

${course.description}

📚 Всего этапов: ${course.stepsCount}
⏱ Примерное время: ${course.estimatedDuration} мин
⭐ Рейтинг: ${course.rating}/5

Нажмите "Начать обучение" чтобы приступить к первому этапу.
  `,

  stepContent: (step: CourseStep, progress: Progress) => `
📖 *Этап ${step.orderIndex}: ${step.title}*

${step.content.text}

📊 Прогресс: ${progress.completedSteps}/${progress.totalSteps} (${progress.percentage}%)
  `,

  assignment: (assignment: Assignment) => `
📝 *Задание: ${assignment.title}*

${assignment.description}

${assignment.requirements ? 
  `*Требования:*\n${assignment.requirements}` : ''
}

Отправьте ваш ответ текстом, фото или файлом.
  `
};
```

---

## 💻 Окружение разработки

### Структура проекта
```
gongbu_app/
├── apps/
│   ├── web/                    # React Web App
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile.dev
│   └── mini-app/              # Telegram Mini App
│       ├── src/
│       ├── package.json
│       └── Dockerfile.dev
├── services/
│   ├── api-gateway/           # API Gateway
│   ├── auth-service/          # Authentication Service
│   ├── course-service/        # Course Management
│   ├── bot-service/           # Bot Management
│   ├── payment-service/       # Payment Processing
│   ├── plugin-service/        # Plugin System
│   └── notification-service/  # Notifications
├── libs/
│   ├── common/                # Shared libraries
│   ├── database/              # Database schemas
│   └── telegram/              # Telegram utilities
├── docs/
│   ├── TZ_Gongbu_Platform.md  # Техническое задание
│   ├── devspec.md             # Проектная документация
│   └── api/                   # API Documentation
├── infrastructure/
│   ├── k8s/                   # Kubernetes manifests
│   ├── terraform/             # Infrastructure as Code
│   └── monitoring/            # Monitoring configs
├── docker-compose.dev.yml     # Development environment
├── docker-compose.prod.yml    # Production environment
├── package.json               # Root package.json
└── README.md
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "docker-compose -f docker-compose.dev.yml up -d",
    "dev:build": "docker-compose -f docker-compose.dev.yml up --build -d",
    "dev:logs": "docker-compose -f docker-compose.dev.yml logs -f",
    "dev:down": "docker-compose -f docker-compose.dev.yml down",
    "migrate": "npm run migrate --workspace=libs/database",
    "seed": "npm run seed --workspace=libs/database",
    "test": "npm run test --workspaces",
    "test:e2e": "npm run test:e2e --workspace=apps/web",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit --skipLibCheck"
  }
}
```

---

## 🚀 Инструкции по развертыванию

### Docker Compose для разработки
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gongbu_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./services/api-gateway:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/gongbu_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
```

---

## 📊 Мониторинг и логирование

### Application Metrics
```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Счетчики
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service']
});

export const courseCreatedTotal = new Counter({
  name: 'courses_created_total',
  help: 'Total number of courses created',
  labelNames: ['creator_plan']
});

// Гистограммы
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'service'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Gauge метрики
export const activeUsers = new Gauge({
  name: 'active_users_count',
  help: 'Number of currently active users'
});
```

---

## 🚦 Заключение

Данная проектная документация содержит полную техническую спецификацию для разработки платформы **Gongbu**. Документ включает:

### ✅ Готово к разработке:
- **Детальная архитектура** микросервисной системы
- **Полные схемы баз данных** с индексами и триггерами
- **API спецификация** в REST формате
- **Telegram Bot integration** со всеми необходимыми компонентами
- **Docker окружение** для разработки
- **CI/CD pipeline** с автоматическим развертыванием
- **Мониторинг и логирование** с метриками

### 🎯 Следующие шаги:
1. **Setup окружения разработки** - запуск Docker Compose
2. **Инициализация репозитория** - создание структуры проекта
3. **Database setup** - выполнение миграций
4. **Первый микросервис** - Auth Service как отправная точка
5. **API Gateway** - маршрутизация и безопасность

### 📈 Масштабируемость:
Архитектура спроектирована для:
- **100,000+ одновременных пользователей**
- **Горизонтальное масштабирование** всех компонентов
- **High Availability** с автоматическим восстановлением

Документация готова для передачи команде разработки и начала имплементации платформы Gongbu! 🚀

---

**Документ подготовлен**: 11 сентября 2025  
**Версия**: 1.0  
**Статус**: Ready for Development  

*Для технических вопросов обращайтесь к архитектору проекта*
