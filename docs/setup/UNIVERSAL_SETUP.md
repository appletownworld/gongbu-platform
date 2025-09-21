# 🚀 Универсальная настройка Gongbu Platform

Этот гид поможет запустить проект как локально для разработки, так и на VPS для продакшна, используя одну конфигурацию.

## 📁 Файловая структура

```
gongbu_app/
├── docker-compose.yml          # 🎯 Универсальная конфигурация
├── nginx.conf                  # 🔒 Production nginx с SSL
├── nginx.local.conf           # 🔧 Development nginx без SSL
├── .env                       # 🏠 Локальные переменные (создайте)
├── .env.production           # 🌐 Production переменные (создайте)
└── UNIVERSAL_SETUP.md        # 📖 Этот файл
```

## 🏠 Локальная разработка

### 1. Создайте `.env` файл:

```bash
cp .env.example .env  # если есть, или создайте вручную
```

```env
# === ОСНОВНЫЕ НАСТРОЙКИ ===
NODE_ENV=development
COMPOSE_PROJECT_NAME=gongbu_local

# === ДОМЕНЫ И URL ===
DOMAIN_NAME=localhost
API_BASE_URL=http://localhost:3001/api
WEBAPP_URL=http://localhost:3000
TELEGRAM_WEBHOOK_URL=http://localhost:3003/webhook

# === БАЗА ДАННЫХ ===
POSTGRES_DB=gongbu_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/gongbu_dev

# === REDIS ===
REDIS_PASSWORD=redis_dev
REDIS_URL=redis://:redis_dev@redis:6379

# === JWT ===
JWT_SECRET=dev-jwt-secret-key-not-for-production

# === TELEGRAM BOT (опционально) ===
TELEGRAM_BOT_TOKEN=your_test_bot_token
TELEGRAM_BOT_USERNAME=your_test_bot

# === ПОРТЫ ===
POSTGRES_PORT=5433
REDIS_PORT=6379
NGINX_HTTP_PORT=80

# === NGINX ===
NGINX_CONFIG=nginx.local.conf
```

### 2. Запуск локально:

```bash
# Запуск всех сервисов
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### 3. Доступ к сервисам:

- **🌐 Веб-приложение**: http://localhost
- **🔧 API**: http://localhost/api
- **🏥 Health Check**: http://localhost/health
- **💾 PostgreSQL**: localhost:5433
- **🔴 Redis**: localhost:6379

## 🌐 Production (VPS)

### 1. На VPS создайте `.env` файл:

```bash
nano .env
```

```env
# === ОСНОВНЫЕ НАСТРОЙКИ ===
NODE_ENV=production
COMPOSE_PROJECT_NAME=gongbu_prod

# === ДОМЕНЫ И URL (ИЗМЕНИТЕ!) ===
DOMAIN_NAME=yourdomain.com
API_BASE_URL=https://yourdomain.com/api
WEBAPP_URL=https://yourdomain.com
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/webhook

# === БАЗА ДАННЫХ (ПОМЕНЯЙТЕ ПАРОЛИ!) ===
POSTGRES_DB=gongbu_platform
POSTGRES_USER=gongbu_user
POSTGRES_PASSWORD=very_secure_password_here
DATABASE_URL=postgresql://gongbu_user:very_secure_password_here@postgres:5432/gongbu_platform

# === REDIS (ПОМЕНЯЙТЕ ПАРОЛЬ!) ===
REDIS_PASSWORD=very_secure_redis_password
REDIS_URL=redis://:very_secure_redis_password@redis:6379

# === JWT (ПОМЕНЯЙТЕ СЕКРЕТ!) ===
JWT_SECRET=super-secure-jwt-secret-32-chars-min

# === TELEGRAM BOT ===
TELEGRAM_BOT_TOKEN=your_real_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=your_real_bot_username

# === NGINX ===
NGINX_CONFIG=nginx.conf
```

### 2. Настройте SSL сертификаты:

```bash
# Убедитесь что домен указывает на ваш VPS
# Получите SSL сертификат
sudo certbot certonly --standalone -d yourdomain.com

# Скопируйте сертификаты в проект (опционально)
sudo cp -r /etc/letsencrypt ./letsencrypt
sudo chown -R $USER:$USER ./letsencrypt
```

### 3. Запуск на VPS:

```bash
# Запуск production
docker-compose up -d --build

# Проверка
docker-compose ps
curl -I https://yourdomain.com/health
```

## 🔧 Полезные команды

### Разработка:
```bash
# Пересборка конкретного сервиса
docker-compose up -d --build web-app

# Логи конкретного сервиса
docker-compose logs -f auth-service

# Выполнение команд в контейнере
docker-compose exec postgres psql -U postgres -d gongbu_dev

# Очистка (ОСТОРОЖНО: удаляет все данные)
docker-compose down -v
```

### Production:
```bash
# Обновление без downtime
docker-compose pull
docker-compose up -d --no-deps --build web-app

# Бэкап базы данных
docker-compose exec postgres pg_dump -U gongbu_user gongbu_platform > backup.sql

# Мониторинг ресурсов
docker stats
```

## 🔍 Отладка

### Проверка подключений:
```bash
# База данных
docker-compose exec postgres psql -U postgres -c "SELECT version();"

# Redis
docker-compose exec redis redis-cli -a redis_dev ping

# API
curl http://localhost/api/health
```

### Логи по сервисам:
```bash
docker-compose logs nginx      # Reverse proxy
docker-compose logs web-app    # React frontend  
docker-compose logs auth-service    # API
docker-compose logs bot-service     # Telegram bot
docker-compose logs postgres        # База данных
```

## 🎯 Ключевые особенности

✅ **Универсальность**: Один `docker-compose.yml` для всех сред  
✅ **Переменные среды**: Все различия в `.env` файлах  
✅ **Health checks**: Автоматическая проверка здоровья сервисов  
✅ **Graceful restart**: Сервисы перезапускаются при падении  
✅ **SSL ready**: Поддержка Let's Encrypt сертификатов  
✅ **Development friendly**: Hot reload в development режиме  

## ⚠️ Важные моменты

1. **Безопасность**: Всегда меняйте пароли в production
2. **SSL**: На VPS обязательно настройте HTTPS
3. **Backup**: Регулярно делайте резервные копии БД
4. **Monitoring**: Следите за логами и метриками

## 🆘 Помощь

При проблемах:
1. Проверьте логи: `docker-compose logs`
2. Проверьте health checks: `docker-compose ps`
3. Проверьте переменные: `docker-compose config`
