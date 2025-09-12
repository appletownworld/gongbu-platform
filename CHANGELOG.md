# Changelog

Все значительные изменения в этом проекте будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
и этот проект придерживается [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions workflows для CI/CD
- Шаблоны для Issues и Pull Requests
- Политика безопасности (SECURITY.md)
- Кодекс поведения (CODE_OF_CONDUCT.md)

### Changed
- Обновлены ссылки в README.md на правильный GitHub репозиторий

## [0.1.0] - 2025-01-27

### Added
- 🎓 Базовая архитектура Gongbu Platform
- 🌐 Web App на React с TypeScript
- 🔐 Auth Service с Telegram WebApp интеграцией
- 📚 Course Service для управления курсами
- 🤖 Bot Service для Telegram бота
- 💳 Payment Service для обработки платежей
- 📧 Notification Service для уведомлений
- 🌐 API Gateway как единая точка входа
- 📊 Analytics Service для метрик
- 🐳 Docker контейнеризация всех сервисов
- 🗄️ PostgreSQL база данных
- ⚡ Redis для кеширования
- 🔍 Elasticsearch для поиска
- 🌐 Nginx reverse proxy
- 📊 Prometheus + Grafana мониторинг
- 📚 Подробная документация
- 🤝 Гайдлайны для контрибьюторов
- 🛡️ MIT лицензия

### Technical Details
- **Backend**: Node.js + TypeScript + NestJS
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis 7
- **Search**: Elasticsearch 8
- **Bot**: Telegraf framework
- **Infrastructure**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions (планируется)

---

## Типы изменений

- **Added** - для новых функций
- **Changed** - для изменений в существующей функциональности
- **Deprecated** - для функций, которые скоро будут удалены
- **Removed** - для удаленных функций
- **Fixed** - для исправлений ошибок
- **Security** - для исправлений уязвимостей
