# 🛡️ Gongbu Platform - Security Best Practices

## 🎯 Обзор безопасности

Gongbu Platform обрабатывает чувствительные данные пользователей и платежную информацию. Соблюдение мер безопасности критически важно для защиты данных и репутации.

## 🔐 Управление секретами

### GitHub Secrets
- ✅ **Используйте только GitHub Secrets** для продакшн конфигурации
- ✅ **Генерируйте уникальные пароли** для каждого окружения
- ✅ **Регулярно ротируйте секреты** (каждые 90 дней)
- ❌ **Никогда не коммитьте секреты** в репозиторий

### Генерация безопасных паролей
```bash
# База данных (32 символа)
openssl rand -base64 32

# JWT секрет (64+ символа) 
openssl rand -base64 64

# API ключи (48 символов)
openssl rand -base64 48

# Telegram WebApp секрет
openssl rand -hex 32
```

### Хранение секретов локально
- ✅ Используйте менеджер паролей (1Password, Bitwarden)
- ✅ Шифруйте файлы с секретами
- ❌ Не храните в текстовых файлах
- ❌ Не передавайте через незащищенные каналы

## 🌐 Веб-безопасность

### HTTPS и TLS
```bash
# Let's Encrypt сертификат
sudo certbot --nginx -d yourdomain.com

# Проверка настроек TLS
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Заголовки безопасности (Nginx)
```nginx
# /etc/nginx/sites-available/gongbu-platform
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### CORS конфигурация
- ✅ Указывайте точные домены в CORS_ORIGIN
- ❌ Не используйте "*" в продакшне
- ✅ Ограничивайте методы HTTP

## 🗄️ Безопасность базы данных

### PostgreSQL настройки
```sql
-- Создание пользователя с ограниченными правами
CREATE USER gongbu_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE gongbu_platform TO gongbu_user;
GRANT USAGE ON SCHEMA public TO gongbu_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gongbu_user;

-- Настройка SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/cert.pem';
ALTER SYSTEM SET ssl_key_file = '/path/to/key.pem';
```

### Резервное копирование
```bash
# Ежедневные бэкапы с шифрованием
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U gongbu_user gongbu_platform | gzip | gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output backup_$DATE.sql.gz.gpg
```

## 🐳 Docker безопасность

### Dockerfile best practices
```dockerfile
# Используйте конкретные теги, не latest
FROM node:18-alpine

# Создайте non-root пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Установите права доступа
COPY --from=builder --chown=nextjs:nodejs /app .
USER nextjs
```

### Docker Compose безопасность
```yaml
# docker-compose.prod.yml
services:
  postgres:
    # Не экспонируйте порты наружу без необходимости
    # ports:
    #   - "5432:5432"  # Закомментировано!
    environment:
      # Используйте секреты Docker
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
```

## 🤖 Telegram Bot безопасность

### Валидация входящих данных
```typescript
// Всегда валидируйте данные от Telegram
function validateTelegramData(data: any): boolean {
  if (!data.user?.id || typeof data.user.id !== 'number') {
    return false;
  }
  
  if (!data.hash || typeof data.hash !== 'string') {
    return false;
  }
  
  // Проверка подписи Telegram WebApp
  return verifyTelegramWebAppData(data);
}
```

### Ограничение доступа
```typescript
// Middleware для проверки администраторов
const adminMiddleware = (ctx: Context, next: () => Promise<void>) => {
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(Number) || [];
  
  if (!adminIds.includes(ctx.from?.id)) {
    return ctx.reply('❌ Доступ запрещен');
  }
  
  return next();
};
```

## 🔍 Мониторинг и логирование

### Центральное логирование
```javascript
// winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'gongbu-platform' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Мониторинг подозрительной активности
```bash
# Fail2ban для защиты от брутфорса
sudo apt install fail2ban

# Конфигурация /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
```

## 🚨 Инцидент-менеджмент

### План реагирования на инциденты
1. **Обнаружение** - мониторинг алертов
2. **Оценка** - определение масштаба проблемы
3. **Изоляция** - остановка распространения
4. **Устранение** - исправление уязвимости
5. **Восстановление** - возврат к нормальной работе
6. **Анализ** - post-mortem и улучшения

### Контакты экстренного реагирования
```env
# .env
SECURITY_ALERT_EMAIL=security@yourdomain.com
SECURITY_ALERT_TELEGRAM=@your_security_bot
SECURITY_ALERT_WEBHOOK=https://hooks.slack.com/your_webhook
```

## 📋 Чеклист безопасности перед продакшном

### 🔐 Аутентификация и авторизация
- [ ] JWT секреты сгенерированы криптографически стойко
- [ ] Время жизни токенов ограничено (< 24 часа)
- [ ] Реализована ротация refresh токенов
- [ ] Настроена двухфакторная аутентификация для админов

### 🌐 Сетевая безопасность
- [ ] Настроен firewall (только 22, 80, 443 порты)
- [ ] SSL/TLS сертификаты установлены и валидны
- [ ] HSTS заголовки настроены
- [ ] Нет открытых debug портов

### 🗄️ База данных
- [ ] Пользователь БД имеет минимальные права
- [ ] Подключения к БД шифрованы (SSL)
- [ ] Настроено автоматическое резервное копирование
- [ ] Бэкапы тестированы на восстановление

### 🐳 Контейнеры
- [ ] Образы обновлены до последних версий
- [ ] Контейнеры запускаются от non-root пользователя  
- [ ] Секреты передаются через Docker secrets
- [ ] Нет лишних capabilities у контейнеров

### 📊 Мониторинг
- [ ] Настроены алерты на критические ошибки
- [ ] Логи централизованы и ротируются
- [ ] Метрики производительности отслеживаются
- [ ] Уведомления о деплоях работают

### 🔄 Процессы
- [ ] Документирован план реагирования на инциденты
- [ ] Настроена ротация секретов
- [ ] Определены ответственные за безопасность
- [ ] Проведен тест восстановления после сбоя

## 📞 Контакты и поддержка

**При обнаружении уязвимостей:**
- 📧 security@gongbu-platform.com
- 🔐 GPG Key: [публичный ключ]
- 📱 Telegram: @gongbu_security

**Ответственные за безопасность:**
- Lead Security Engineer: [имя, контакты]
- DevOps Engineer: [имя, контакты]  
- CTO: [имя, контакты]

---

**⚠️ Помните: безопасность - это непрерывный процесс, а не одноразовая настройка!**
