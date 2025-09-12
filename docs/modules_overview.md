# Модули системы Gongbu Platform

**Версия:** 1.0  
**Дата:** 11 сентября 2025  

---

## 📋 Обзор архитектуры

Система Gongbu построена на микросервисной архитектуре из 8 основных модулей, каждый из которых отвечает за специфичную функциональность.

### 🏗️ Архитектурная схема

```
                        ┌─────────────────┐
                        │   API Gateway   │
                        │    (Port 3000)  │
                        └────────┬────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
    ┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
    │  Auth Service  │  │ Course Service │  │  Bot Service   │
    │  (Port 3001)   │  │  (Port 3002)   │  │  (Port 3003)   │
    └────────────────┘  └────────────────┘  └────────────────┘
            │                    │                    │
    ┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
    │Payment Service │  │Plugin Service  │  │Notification    │
    │  (Port 3004)   │  │  (Port 3005)   │  │Service(3006)   │
    └────────────────┘  └────────────────┘  └────────────────┘
            │
    ┌───────▼────────┐
    │Analytics       │
    │Service(3007)   │
    └────────────────┘
```

---

## 🧩 Модули системы

### 1. API Gateway Module
**Файл:** [api-gateway.md](./modules/api-gateway.md)  
**Порт:** 3000  
**Ответственности:**
- Единая точка входа для всех клиентов
- Маршрутизация запросов к микросервисам  
- Rate limiting и защита от DDoS
- Аутентификация и авторизация
- CORS и безопасность
- Логирование всех запросов

**Зависимости:**
- Все остальные сервисы
- Redis (сессии, кеш)
- Prometheus (метрики)

---

### 2. Auth Service Module  
**Файл:** [auth-service.md](./modules/auth-service.md)  
**Порт:** 3001  
**Ответственности:**
- Аутентификация через Telegram OAuth
- Управление JWT токенами
- Профили пользователей
- Система ролей и разрешений
- Подписки пользователей

**Зависимости:**
- PostgreSQL (пользователи)
- Redis (сессии)
- Telegram Bot API

---

### 3. Course Service Module
**Файл:** [course-service.md](./modules/course-service.md)  
**Порт:** 3002  
**Ответственности:**
- CRUD операции с курсами
- Управление этапами курса
- Квизы и задания
- Прогресс студентов
- Контент-менеджмент

**Зависимости:**
- PostgreSQL (курсы, этапы)
- Redis (кеш курсов)
- Elasticsearch (поиск)
- AWS S3/MinIO (медиафайлы)

---

### 4. Bot Service Module
**Файл:** [bot-service.md](./modules/bot-service.md)  
**Порт:** 3003  
**Ответственности:**
- Автоматическая генерация ботов
- Обработка Telegram webhook'ов
- Навигация по курсу
- Интерактивные элементы
- Mini-App интеграция

**Зависимости:**
- Course Service
- Payment Service  
- Telegram Bot API
- PostgreSQL (bot tokens)

---

### 5. Payment Service Module
**Файл:** [payment-service.md](./modules/payment-service.md)  
**Порт:** 3004  
**Ответственности:**
- Обработка платежей через Telegram
- Подписки пользователей
- Финансовая аналитика
- Возвраты и споры
- Комиссии платформы

**Зависимости:**
- Auth Service
- Course Service
- Telegram Payment API
- Stripe API (опционально)

---

### 6. Plugin Service Module
**Файл:** [plugin-service.md](./modules/plugin-service.md)  
**Порт:** 3005  
**Ответственности:**
- Marketplace плагинов
- Sandbox выполнение
- Plugin API
- Версионирование плагинов
- Система рейтингов

**Зависимости:**
- Course Service
- Auth Service
- NodeVM (sandbox)
- PostgreSQL (плагины)

---

### 7. Notification Service Module
**Файл:** [notification-service.md](./modules/notification-service.md)  
**Порт:** 3006  
**Ответственности:**
- Push уведомления
- Email рассылки  
- Telegram сообщения
- Шаблоны уведомлений
- Очереди отправки

**Зависимости:**
- All services (события)
- Redis (очереди)
- SendGrid/AWS SES
- Telegram Bot API

---

### 8. Analytics Service Module
**Файл:** [analytics-service.md](./modules/analytics-service.md)  
**Порт:** 3007  
**Ответственности:**
- Сбор метрик пользователей
- Бизнес-аналитика
- Отчеты для создателей
- A/B тестирование
- Рекомендательная система

**Зависимости:**
- All services (события)
- ClickHouse/PostgreSQL
- Redis (real-time данные)
- ML модели

---

## 🔄 Межсервисная коммуникация

### Синхронные вызовы (HTTP/gRPC)
- API Gateway → все сервисы
- Bot Service → Course Service, Payment Service
- Plugin Service → Course Service
- Payment Service → Auth Service, Course Service

### Асинхронные сообщения (Kafka/Redis)
- Все сервисы → Analytics Service (события)
- Course Service → Notification Service (обновления курса)
- Payment Service → Notification Service (платежи)
- Auth Service → Notification Service (регистрации)

### Shared Data
- Redis: сессии, кеш, real-time данные
- PostgreSQL: основные данные всех сервисов
- Elasticsearch: поиск по курсам и контенту

---

## 📊 Метрики и мониторинг

Каждый сервис экспортирует метрики на эндпоинте `/metrics`:

### Общие метрики
- `http_requests_total` - количество HTTP запросов
- `http_request_duration_seconds` - время выполнения запросов
- `database_query_duration_seconds` - время выполнения SQL запросов

### Специфичные метрики
- `courses_created_total` (Course Service)
- `bots_generated_total` (Bot Service)  
- `payments_processed_total` (Payment Service)
- `plugins_installed_total` (Plugin Service)

---

## 🚀 Порядок запуска сервисов

1. **Инфраструктура:** PostgreSQL, Redis, Elasticsearch
2. **Core Services:** Auth Service, Course Service  
3. **Business Services:** Payment Service, Plugin Service
4. **Integration Services:** Bot Service, Notification Service
5. **Analytics:** Analytics Service
6. **Gateway:** API Gateway (последним)

---

## 📁 Структура репозитория

```
gongbu_app/
├── services/
│   ├── api-gateway/        # API Gateway Module
│   ├── auth-service/       # Authentication Module  
│   ├── course-service/     # Course Management Module
│   ├── bot-service/        # Telegram Bot Module
│   ├── payment-service/    # Payment Processing Module
│   ├── plugin-service/     # Plugin System Module
│   ├── notification-service/ # Notifications Module
│   └── analytics-service/  # Analytics Module
├── libs/
│   ├── common/            # Shared utilities
│   ├── database/          # Database schemas
│   ├── telegram/          # Telegram SDK
│   └── types/             # TypeScript definitions
└── apps/
    ├── web/               # React Web Application
    └── mini-app/          # Telegram Mini Application
```

---

**Следующие шаги:**
1. Изучить детализацию каждого модуля в соответствующих файлах
2. Ознакомиться с API контрактами между сервисами  
3. Подготовить окружение разработки
4. Начать с реализации Auth Service как базового модуля
