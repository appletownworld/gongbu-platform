# 🔑 КОНФИГУРАЦИЯ GITHUB SECRETS

> **КРИТИЧЕСКИ ВАЖНО:** Этот файл содержит официальные имена GitHub Secrets для проекта Gongbu Platform.
> При любых изменениях в коде ВСЕГДА используй только эти имена!

## 📋 ОФИЦИАЛЬНЫЙ СПИСОК СЕКРЕТОВ

### 🔐 Аутентификация и безопасность:
- **`JWT_SECRET`** - секретный ключ для JWT токенов
- **`TELEGRAM_BOT_TOKEN`** - токен Telegram бота от @BotFather  
- **`TELEGRAM_WEBAPP_SECRET`** - секрет для Telegram WebApp
- **`ADMIN_USER_IDS`** - список Telegram ID администраторов (через запятую)

### 🗄️ База данных:
- **`POSTGRES_PASSWORD`** - пароль PostgreSQL БД (**используется для DB_PASSWORD**)
- **`REDIS_PASSWORD`** - пароль Redis

### 🌐 URL и сеть:
- **`APP_URL`** - основной URL приложения (https://domain.com)
- **`API_BASE_URL`** - базовый URL для API
- **`WEBHOOK_URL`** - URL для Telegram webhook
- **`WEBSOCKET_URL`** - URL для WebSocket соединений  
- **`DOMAIN_NAME`** - доменное имя проекта
- **`CORS_ORIGIN`** - разрешенные CORS origins

### 🖥️ VPS и мониторинг:
- **`VPS_HOST`** - IP адрес VPS сервера
- **`VPS_USER`** - пользователь для SSH подключения
- **`VPS_SSH_KEY`** - приватный SSH ключ для доступа к VPS
- **`GRAFANA_ADMIN_PASSWORD`** - пароль админа Grafana

---

## ⚠️ ВАЖНЫЕ ПРАВИЛА

### ✅ ЧТО ДЕЛАТЬ:
1. **Используй только имена из списка выше**
2. **Проверяй соответствие перед каждым изменением**
3. **Обновляй этот файл при добавлении новых секретов**

### ❌ ЧТО НЕ ДЕЛАТЬ:
1. **НЕ создавай новые имена** без обновления этого файла
2. **НЕ используй следующие имена** (они генерируются автоматически):
   - `DATABASE_URL` (создается из `POSTGRES_PASSWORD`)
   - `DB_USER` (статично: `gongbu_user`)
   - `DB_PASSWORD` (используется `POSTGRES_PASSWORD`)

---

## 📝 ПРИМЕР ИСПОЛЬЗОВАНИЯ В .github/workflows/deploy.yml

```yaml
# Создание .env из секретов GitHub
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000

# Database (используем POSTGRES_PASSWORD, НЕ DB_PASSWORD!)
DATABASE_URL=postgresql://gongbu_user:${{ secrets.POSTGRES_PASSWORD }}@localhost:5432/gongbu_platform
DB_USER=gongbu_user
DB_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=${{ secrets.REDIS_PASSWORD }}

# JWT
JWT_SECRET=${{ secrets.JWT_SECRET }}
JWT_EXPIRES_IN=7d

# Telegram
TELEGRAM_BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }}
TELEGRAM_BOT_USERNAME=gongbu_platform_bot
TELEGRAM_WEBHOOK_URL=${{ secrets.WEBHOOK_URL }}
TELEGRAM_WEBAPP_SECRET=${{ secrets.TELEGRAM_WEBAPP_SECRET }}
WEBHOOK_URL=${{ secrets.WEBHOOK_URL }}
ADMIN_USER_IDS=${{ secrets.ADMIN_USER_IDS }}

# URLs
WEBAPP_URL=${{ secrets.APP_URL }}
APP_URL=${{ secrets.APP_URL }}
API_BASE_URL=${{ secrets.API_BASE_URL }}
WEBSOCKET_URL=${{ secrets.WEBSOCKET_URL }}
DOMAIN_NAME=${{ secrets.DOMAIN_NAME }}

# CORS
CORS_ORIGIN=${{ secrets.CORS_ORIGIN }}

# Monitoring
GRAFANA_ADMIN_PASSWORD=${{ secrets.GRAFANA_ADMIN_PASSWORD }}
EOF
```

---

## 🔄 ИСТОРИЯ ИЗМЕНЕНИЙ

- **2024-09-18:** Создан файл после исправления проблемы несоответствия имен секретов
- **Проблема была:** deploy.yml использовал `secrets.DATABASE_URL`, `secrets.DB_PASSWORD`, а в GitHub Secrets были `POSTGRES_PASSWORD`
- **Решение:** Обновлен deploy.yml для использования правильных имен секретов

---

## 📞 В СЛУЧАЕ ПРОБЛЕМ

Если возникают ошибки с переменными окружения:

1. **Проверь GitHub Secrets:** https://github.com/appletownworld/gongbu-platform/settings/secrets/actions
2. **Сравни с этим файлом** - все ли имена совпадают?
3. **Проверь .github/workflows/deploy.yml** - использует ли правильные имена?
4. **Запусти диагностический деплой** - он покажет что записалось в .env

💡 **Помни:** Один неправильный секрет = весь деплой не работает!
