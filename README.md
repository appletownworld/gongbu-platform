# 🎓 Gongbu Platform

> Современная образовательная платформа с интеграцией Telegram Bot для изучения программирования и IT-навыков.

[![Deploy to VPS](https://github.com/appletownworld/gongbu-platform/actions/workflows/deploy.yml/badge.svg)](https://github.com/appletownworld/gongbu-platform/actions/workflows/deploy.yml)
[![Tests](https://github.com/appletownworld/gongbu-platform/actions/workflows/test.yml/badge.svg)](https://github.com/appletownworld/gongbu-platform/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Быстрый старт

### Развертывание на VPS (15 минут)

```bash
# 1. Подготовка сервера
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2. Клонирование проекта
git clone https://github.com/appletownworld/gongbu-platform.git
cd gongbu-platform

# 3. Настройка окружения
cp .env.production .env
nano .env  # Заполните ваши данные

# 4. Автоматическое развертывание
./deploy.sh
```

**Готово!** Платформа доступна по адресу `https://your-domain.com`

## 🏗️ Архитектура

### Микросервисы
- **🌐 Web App** - React приложение с современным UI
- **🔐 Auth Service** - Аутентификация через Telegram WebApp
- **📚 Course Service** - Управление курсами и прогрессом
- **🤖 Bot Service** - Интерактивный Telegram бот
- **💳 Payment Service** - Система оплаты курсов
- **📧 Notification Service** - Email и push уведомления
- **🌐 API Gateway** - Единая точка входа
- **📊 Analytics Service** - Сбор и анализ метрик

### Инфраструктура
- **🐳 Docker** - Контейнеризация всех сервисов
- **🗄️ PostgreSQL** - Основная база данных
- **⚡ Redis** - Кеширование и сессии
- **🔍 Elasticsearch** - Поиск по курсам
- **🌐 Nginx** - Reverse proxy и SSL
- **📊 Prometheus + Grafana** - Мониторинг

## ✨ Возможности

### Для студентов:
- 📚 Каталог курсов с поиском и фильтрами
- 📊 Отслеживание прогресса обучения
- 🏆 Система достижений и сертификатов
- 🤖 Интерактивный Telegram бот-помощник
- 💳 Гибкая система оплаты курсов

### Для преподавателей:
- ✏️ Создание и редактирование курсов
- 📈 Аналитика по студентам
- 💬 Система обратной связи
- 🎥 Поддержка различных типов контента

### Для администраторов:
- 👥 Управление пользователями
- 📊 Детальная аналитика платформы
- ⚙️ Конфигурация системы
- 🔒 Безопасность и мониторинг

## 🛠️ Технологический стек

### Backend
- **Node.js** + **TypeScript** - Основа сервисов
- **NestJS** - Фреймворк для микросервисов
- **Prisma ORM** - Работа с базой данных
- **JWT** - Аутентификация и авторизация
- **Telegraf** - Telegram Bot Framework

### Frontend
- **React 18** - Пользовательский интерфейс
- **TypeScript** - Типизация
- **Tailwind CSS** - Стили и дизайн
- **Vite** - Сборщик и dev-сервер
- **React Query** - Управление состоянием сервера

### DevOps & Infrastructure
- **Docker** - Контейнеризация
- **Docker Compose** - Оркестрация
- **GitHub Actions** - CI/CD пайплайн
- **Nginx** - Web-сервер и прокси
- **Let's Encrypt** - SSL сертификаты

## 📋 Требования

### Для VPS развертывания:
- **ОС**: Ubuntu 20.04+, CentOS 8+, Debian 11+
- **RAM**: минимум 4GB (рекомендуется 8GB+)
- **CPU**: минимум 2 ядра (рекомендуется 4+)
- **Диск**: минимум 50GB SSD (рекомендуется 100GB+)
- **Домен**: настроенный на IP сервера

### Для разработки:
- **Node.js** 18+
- **Docker** и **Docker Compose**
- **PostgreSQL** 14+
- **Redis** 6+

## 🚀 Развертывание

### 1. Автоматическое через GitHub Actions

1. **Fork** этот репозиторий
2. Настройте **Secrets** в GitHub:
   ```
   VPS_HOST=your-server-ip
   VPS_USER=ubuntu
   VPS_SSH_KEY=your-private-ssh-key
   DOMAIN_NAME=your-domain.com
   API_BASE_URL=https://your-domain.com/api
   TELEGRAM_BOT_TOKEN=your-bot-token
   # ... и другие переменные
   ```
3. **Push** в main ветку для автоматического деплоя

### 2. Ручное развертывание

См. подробную инструкцию в [VPS-DEPLOYMENT.md](VPS-DEPLOYMENT.md)

## 🔧 Разработка

### Запуск локально

```bash
# Клонирование
git clone https://github.com/appletownworld/gongbu-platform.git
cd gongbu-platform

# Запуск инфраструктуры
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Запуск сервисов
cd services/auth-service && npm install && npm run dev
cd ../course-service && npm install && npm run dev
cd ../bot-service && npm install && npm run dev

# Запуск фронтенда
cd ../../apps/web-app && npm install && npm run dev
```

### Структура проекта

```
gongbu-platform/
├── apps/
│   └── web-app/                 # React веб-приложение
├── services/
│   ├── auth-service/           # Сервис аутентификации
│   ├── course-service/         # Сервис курсов
│   ├── bot-service/           # Telegram бот
│   ├── payment-service/       # Платежная система
│   └── notification-service/  # Уведомления
├── infrastructure/
│   ├── nginx/                 # Nginx конфигурация
│   ├── monitoring/           # Prometheus & Grafana
│   └── docker/              # Docker конфигурации
├── .github/workflows/        # CI/CD пайплайны
├── docker-compose.prod.yml   # Production конфигурация
└── deploy.sh                # Скрипт развертывания
```

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Линтинг
npm run lint

# Проверка типов
npm run type-check

# Интеграционные тесты
npm run test:integration
```

## 📊 Мониторинг

После развертывания доступны:

- **📊 Grafana**: `https://your-domain.com/grafana`
- **🔥 Prometheus**: `http://your-server:9090`
- **📈 Health Check**: `https://your-domain.com/health`

## 🤝 Участие в разработке

1. **Fork** проект
2. Создайте **feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit** изменения: `git commit -m 'Add amazing feature'`
4. **Push** в ветку: `git push origin feature/amazing-feature`
5. Создайте **Pull Request**

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. [LICENSE](LICENSE) файл.

## 🙏 Благодарности

- [NestJS](https://nestjs.com/) - Прогрессивный Node.js фреймворк
- [React](https://reactjs.org/) - Библиотека для пользовательских интерфейсов
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Telegraf](https://telegraf.js.org/) - Modern Telegram Bot Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS фреймворк

## 📞 Поддержка

Если у вас есть вопросы или проблемы:

- 📧 Email: support@gongbu.app
- 💬 Telegram: [@gongbu_support](https://t.me/gongbu_support)
- 🐛 Issues: [GitHub Issues](https://github.com/appletownworld/gongbu-platform/issues)

---

<p align="center">
  Сделано с ❤️ для образования
</p>