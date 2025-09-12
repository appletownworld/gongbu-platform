# 🚀 GitHub Развертывание Gongbu Platform

## 📋 Варианты развертывания через GitHub

### 🤖 1. Автоматическое через GitHub Actions (рекомендуется)
- ✅ **CI/CD пайплайн** - автоматическое тестирование и деплой
- ✅ **Docker Registry** - образы хранятся в GitHub Container Registry
- ✅ **Zero-downtime deployment** - плавное обновление без простоя
- ✅ **Rollback** - откат к предыдущей версии одним кликом

### 🔧 2. Простое клонирование (быстрый старт)
- ✅ **Быстро** - 5 минут до запуска
- ✅ **Просто** - минимум настроек
- ✅ **Подходит для тестирования** - идеально для демо

---

## 🤖 Автоматическое развертывание (GitHub Actions)

### Шаг 1: Fork и настройка репозитория

1. **Fork** репозитория на GitHub
2. В настройках репозитория → **Settings** → **Secrets and variables** → **Actions**
3. Добавьте следующие **Repository Secrets**:

```bash
# VPS подключение
VPS_HOST=123.45.67.89              # IP адрес вашего VPS
VPS_USER=ubuntu                    # Пользователь на VPS
VPS_SSH_KEY=-----BEGIN PRIVATE KEY-----  # Приватный SSH ключ

# Домен и URL
DOMAIN_NAME=gongbu.example.com
API_BASE_URL=https://gongbu.example.com/api
WEBHOOK_URL=https://gongbu.example.com/webhook
WEBSOCKET_URL=wss://gongbu.example.com/ws

# База данных и кеш
POSTGRES_PASSWORD=super_secure_password_123!
REDIS_PASSWORD=redis_password_456!

# Безопасность
JWT_SECRET=your_32_character_jwt_secret_key_789!

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
TELEGRAM_WEBAPP_SECRET=your_webapp_secret
ADMIN_USER_IDS=123456789,987654321

# Платежи (опционально)
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (опционально)
SENDGRID_API_KEY=SG.your_sendgrid_key
EMAIL_FROM=noreply@gongbu.example.com

# CORS
CORS_ORIGIN=https://gongbu.example.com,https://www.gongbu.example.com

# Мониторинг
GRAFANA_ADMIN_PASSWORD=secure_grafana_password

# Уведомления (опционально)
SLACK_WEBHOOK_URL=https://hooks.slack.com/your/webhook/url
APP_URL=https://gongbu.example.com
```

### Шаг 2: Подготовка VPS сервера

```bash
# SSH подключение к серверу
ssh ubuntu@your-server-ip

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# Создание директории проекта
mkdir -p /home/ubuntu/gongbu-platform
cd /home/ubuntu/gongbu-platform

# Настройка SSH ключа (для GitHub Actions)
# Скопируйте публичный ключ в ~/.ssh/authorized_keys
```

### Шаг 3: Запуск развертывания

1. **Push в main ветку** - автоматически запустится деплой:
   ```bash
   git add .
   git commit -m "🚀 Deploy to production"
   git push origin main
   ```

2. **Или ручной запуск** через GitHub:
   - Перейдите в **Actions** → **Deploy Gongbu Platform to VPS**
   - Нажмите **Run workflow** → **Run workflow**

### Шаг 4: Мониторинг развертывания

- **GitHub Actions** - следите за прогрессом в реальном времени
- **Slack уведомления** - получайте статус деплоя (если настроен)
- **Health check** - автоматическая проверка работоспособности

---

## 🔧 Простое развертывание (клонирование)

### Вариант 1: Через HTTPS

```bash
# Подключение к VPS
ssh your-user@your-server-ip

# Установка Docker (если не установлен)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Клонирование проекта
git clone https://github.com/your-username/gongbu-platform.git
cd gongbu-platform

# Настройка окружения
cp .env.production .env
nano .env  # Заполните ваши данные

# Запуск платформы
chmod +x deploy.sh
./deploy.sh
```

### Вариант 2: Загрузка ZIP архива

```bash
# Если нет Git на сервере
wget https://github.com/your-username/gongbu-platform/archive/main.zip
unzip main.zip
mv gongbu-platform-main gongbu-platform
cd gongbu-platform

# Далее как в варианте 1
cp .env.production .env
nano .env
./deploy.sh
```

---

## 🔄 Обновление платформы

### Через GitHub Actions
- **Автоматически** при push в main
- **Или вручную** через Actions

### Через Git Pull
```bash
cd /path/to/gongbu-platform
git pull origin main
./deploy.sh
```

---

## 🐳 Docker образы

### GitHub Container Registry
Все образы автоматически публикуются в:
```
ghcr.io/your-username/gongbu-platform/auth-service:latest
ghcr.io/your-username/gongbu-platform/course-service:latest  
ghcr.io/your-username/gongbu-platform/bot-service:latest
ghcr.io/your-username/gongbu-platform/payment-service:latest
ghcr.io/your-username/gongbu-platform/notification-service:latest
ghcr.io/your-username/gongbu-platform/web-app:latest
```

### Ручная сборка и публикация
```bash
# Логин в GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin

# Сборка и публикация
docker build -f services/auth-service/Dockerfile.prod -t ghcr.io/your-username/gongbu-platform/auth-service:latest .
docker push ghcr.io/your-username/gongbu-platform/auth-service:latest
```

---

## 🔍 Мониторинг и логи

### Просмотр статуса развертывания
```bash
# В GitHub Actions
https://github.com/your-username/gongbu-platform/actions

# На VPS сервере
cd /home/ubuntu/gongbu-platform
./health-check.sh
docker-compose -f docker-compose.prod.yml ps
```

### Просмотр логов
```bash
# Логи всех сервисов
docker-compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f auth-service
```

---

## 🚨 Устранение проблем

### Частые проблемы при GitHub Actions деплое:

**1. SSH ключ не работает**
```bash
# Проверьте формат ключа (должен быть приватный ключ)
# Убедитесь что публичный ключ добавлен в ~/.ssh/authorized_keys на VPS
```

**2. Docker образы не скачиваются**
```bash
# Проверьте права доступа к GitHub Container Registry
# Убедитесь что репозиторий публичный или токен имеет права
```

**3. Сервисы не запускаются**
```bash
# Проверьте переменные окружения
# Убедитесь что все требуемые Secrets заполнены
```

**4. SSL сертификат не получается**
```bash
# Убедитесь что домен указывает на IP сервера
# Проверьте что порты 80 и 443 открыты
```

---

## 🎯 Преимущества GitHub развертывания

### ✅ **Автоматизация**
- Тестирование перед деплоем
- Автоматическая сборка Docker образов
- Zero-downtime обновления

### ✅ **Безопасность**
- Образы сканируются на уязвимости
- Секреты хранятся зашифрованными
- SSL сертификаты автоматически

### ✅ **Мониторинг**
- Статус деплоя в реальном времени
- Уведомления в Slack
- История всех развертываний

### ✅ **Откат**
- Быстрый откат к предыдущей версии
- Теги Docker образов по коммитам
- Backup базы данных перед обновлением

---

## 🎉 Результат

После успешного развертывания у вас будет:

- 🌐 **Веб-приложение**: `https://your-domain.com`
- 🤖 **Telegram бот**: работает автоматически  
- 📊 **Мониторинг**: `https://your-domain.com/grafana`
- 🔒 **SSL**: автоматический HTTPS
- 📧 **Уведомления**: статус в Slack/Email
- 🔄 **CI/CD**: автообновления при новых коммитах

**Развертывание через GitHub = профессиональный DevOps подход! 🚀**
