# 🎓 Gongbu Platform - Telegram-Based Learning Management System

<div align="center">
  <h3>Полноценная платформа для создания и продажи образовательных курсов через Telegram</h3>
  
  ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
  ![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)
  ![Telegram](https://img.shields.io/badge/Telegram-Bot%20API-26A5E4.svg)
</div>

## 🚀 Особенности

### 🎯 **Для Экспертов (Создателей Курсов)**
- 🖥️ **Веб-интерфейс для создания курсов** - интуитивный 3-этапный мастер
- 📝 **Редактор контента** - поддержка видео, аудио, текста, интерактивных элементов
- 📊 **Панель управления** - аналитика, статистика продаж, управление учениками
- 💰 **Монетизация** - интеграция с платежными системами (Stripe, YooKassa)
- 🤖 **Автоматические боты** - уникальный Telegram-бот для каждого курса

### 👨‍🎓 **Для Студентов**
- 📱 **Telegram Mini-App** - обучение прямо в Telegram без дополнительных приложений
- 🎮 **Интерактивные элементы** - квизы, задания, прогресс-бары
- 📈 **Трекинг прогресса** - отслеживание выполнения уроков
- 🏆 **Геймификация** - достижения, баллы, сертификаты
- 💬 **Коммуникация с ботом** - вопросы, поддержка, напоминания

### 🛠️ **Техническая архитектура**
- 🌐 **API Gateway** - единая точка входа со всеми микросервисами
- 🏗️ **Микросервисная архитектура** - 8 независимых сервисов
- ⚡ **React 18 + TypeScript** - современный фронтенд
- 🔥 **NestJS + Prisma** - надежный бэкенд
- 🐘 **PostgreSQL** - масштабируемая база данных
- 🤖 **Telegraf.js** - мощная система ботов
- 🐳 **Docker** - простое развертывание

## 📦 Структура проекта

```
gongbu-platform/
├── apps/
│   └── web-app/              # React Frontend
├── services/
│   ├── api-gateway/          # API Gateway
│   ├── auth-service/         # Аутентификация
│   ├── course-service/       # Управление курсами
│   ├── bot-service/          # Telegram боты ⭐
│   ├── payment-service/      # Платежи
│   ├── notification-service/ # Уведомления
│   └── analytics-service/    # Аналитика
├── docs/                     # 📚 Документация
│   └── guides/               # Все руководства и инструкции
└── docker-compose.yml        # Docker конфигурация
```

## 🎯 Быстрый старт

### 1. Клонирование и установка
```bash
git clone https://github.com/appletownworld/gongbu-platform.git
cd gongbu-platform
npm install
```

### 2. Настройка окружения
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

### 3. Запуск для разработки
```bash
# Быстрая демонстрация с мок-данными
npm run demo

# Или полная система через Docker
docker-compose up -d
```

### 4. Открытие приложения
- 🌐 **Web App**: http://localhost:3000
- 🤖 **Bot API**: http://localhost:3003
- 📊 **Analytics**: http://localhost:3003/analytics

## 🚀 Развертывание в продакшне

Подробные инструкции по развертыванию на VPS в файле [DEPLOYMENT.md](./DEPLOYMENT.md)

### Быстрое развертывание через Docker:
```bash
# Клонирование на сервер
git clone https://github.com/appletownworld/gongbu-platform.git
cd gongbu-platform

# Настройка переменных
cp .env.example .env
nano .env

# Запуск
docker-compose -f docker-compose.prod.yml up -d
```

## 🤖 Демонстрация системы ботов

Запустите демонстрацию полной системы ботов:

```bash
# Демо с симуляцией всех компонентов
node bot-system-demo.js

# Тестирование с реальным Telegram ботом  
# (требуется токен в .env)
node bot-launcher.js
```

**Что входит в демо:**
- ✅ Создание уникальных ботов для курсов
- ✅ Навигация по урокам с прогресс-баром
- ✅ Интерактивные квизы и задания
- ✅ WebApp интеграция
- ✅ Система аналитики
- ✅ REST API для управления

## 📊 API Endpoints

### Bot Service API
```
GET    /health              - Статус системы
GET    /bots                - Список ботов
POST   /bots/create         - Создание бота
GET    /bots/:id            - Информация о боте
POST   /bots/:id/activate   - Активация бота
GET    /analytics           - Аналитика системы
```

### Course API
```
GET    /courses             - Список курсов
POST   /courses             - Создание курса
GET    /courses/:id         - Информация о курсе
PUT    /courses/:id         - Обновление курса
POST   /courses/:id/publish - Публикация курса
```

## 🛠️ Технологии

### Frontend
- **React 18** - современная UI библиотека
- **TypeScript** - типизированный JavaScript
- **Tailwind CSS** - utility-first CSS фреймворк
- **Vite** - быстрый bundler
- **React Query** - управление состоянием сервера

### Backend
- **NestJS** - прогрессивный Node.js фреймворк
- **Prisma ORM** - современная ORM для TypeScript
- **PostgreSQL** - реляционная база данных
- **Redis** - кэширование и сессии
- **Telegraf.js** - Telegram Bot API

### Infrastructure
- **Docker & Docker Compose** - контейнеризация
- **Nginx** - reverse proxy и статика
- **PM2** - process manager для Node.js
- **GitHub Actions** - CI/CD

## 🎯 Примеры использования

### Создание курса через API
```javascript
const course = await fetch('/api/courses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Python для начинающих',
    description: 'Изучите основы программирования',
    category: 'programming',
    difficulty: 'beginner',
    price: 2000
  })
})
```

### Создание Telegram бота для курса
```javascript
const bot = await fetch('/api/bots/create', {
  method: 'POST', 
  body: JSON.stringify({
    courseId: 'course-123',
    botName: 'Python Course Bot',
    welcomeMessage: 'Добро пожаловать на курс Python!'
  })
})
```

## 📈 Мониторинг и логи

```bash
# Статус всех сервисов
curl http://localhost:3003/health

# Аналитика системы ботов
curl http://localhost:3003/analytics

# Логи через PM2
pm2 logs --lines 100

# Логи Docker
docker-compose logs -f --tail=100
```

## 🔒 Безопасность

- 🔐 **JWT аутентификация** для API
- 🛡️ **CORS защита** для фронтенда  
- 🔄 **Rate limiting** для API endpoints
- 🔐 **Encrypted secrets** в базе данных
- 🌐 **HTTPS only** в продакшне
- 🔍 **Валидация всех входных данных**

## 📚 Документация

### **🎯 Основная документация:**
- [📝 Лог разработки](./devlog.md) - полная история создания проекта
- [📋 Техническое задание](./docs/TZ_Gongbu_Platform.md) - требования к системе
- [🔧 API документация](./docs/api/) - техническая документация API
- [🎯 Пользовательские сценарии](./docs/user-scenarios.md) - примеры использования

### **📚 Все руководства и инструкции:**
**👉 [Перейти в центр документации](./docs/guides/README.md) - все гайды, инструкции, отчеты**

**Основные руководства:**
- [📱 Telegram Mini-App Guide](./docs/guides/TELEGRAM_MINIAPP_GUIDE.md) - запуск Mini-App
- [🔐 Auto Registration Guide](./docs/guides/AUTO_REGISTRATION_GUIDE.md) - автоматическая регистрация
- [🗃️ Database Architecture Guide](./docs/guides/DATABASE_ARCHITECTURE_GUIDE.md) - архитектура БД
- [🚀 Deployment Guide](./docs/guides/DEPLOYMENT.md) - развертывание системы

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📞 Поддержка

- 📧 **Email**: support@gongbu-platform.com
- 💬 **Telegram**: @gongbu_support  
- 📖 **Документация**: [GitHub Wiki](https://github.com/appletownworld/gongbu-platform/wiki)
- 🐛 **Issues**: [GitHub Issues](https://github.com/appletownworld/gongbu-platform/issues)

## 📄 Лицензия

Этот проект лицензирован под MIT License - подробности в файле [LICENSE](LICENSE)

---

<div align="center">
  <h3>🚀 Готово к использованию прямо сейчас!</h3>
  <p>Полнофункциональная платформа для создания и продажи образовательных курсов через Telegram</p>
  
  **[🎯 Запустить демо](#-быстрый-старт)** • **[📚 Документация](./docs/)** • **[🚀 Развернуть на VPS](./DEPLOYMENT.md)**
</div>