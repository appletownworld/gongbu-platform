# 🚀 Развертывание Gongbu Platform на VPS

## 📋 Системные требования

### Минимальные требования VPS:
- **RAM**: 4GB (рекомендуется 8GB)
- **CPU**: 2 cores (рекомендуется 4 cores)
- **Диск**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS или новее
- **Порты**: 80, 443, 3000-3010

## 🔧 Подготовка сервера

### 1. Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git vim nginx certbot python3-certbot-nginx -y
```

### 2. Установка Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # должен быть >= 18.0
npm --version
```

### 3. Установка Docker и Docker Compose
```bash
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 4. Установка PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание базы данных
sudo -u postgres psql
CREATE DATABASE gongbu_platform;
CREATE USER gongbu_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE gongbu_platform TO gongbu_user;
\q
```

## 📦 Клонирование и настройка проекта

### 1. Клонирование репозитория
```bash
cd /var/www
sudo git clone https://github.com/appletownworld/gongbu-platform.git
sudo chown -R $USER:$USER gongbu-platform
cd gongbu-platform
```

### 2. Настройка переменных окружения
```bash
cp .env.example .env
```

Отредактируйте `.env` файл:
```env
# Database
DATABASE_URL="postgresql://gongbu_user:secure_password_here@localhost:5432/gongbu_platform"

# JWT
JWT_SECRET="super_secure_jwt_secret_key_256_bit"
JWT_EXPIRES_IN="7d"

# Telegram Bot
TELEGRAM_BOT_TOKEN="YOUR_ACTUAL_BOT_TOKEN_FROM_BOTFATHER"
TELEGRAM_WEBHOOK_URL="https://yourdomain.com/webhook"

# Services URLs
API_GATEWAY_URL="https://yourdomain.com/api"
AUTH_SERVICE_URL="http://localhost:3001"
COURSE_SERVICE_URL="http://localhost:3002"
BOT_SERVICE_URL="http://localhost:3003"
PAYMENT_SERVICE_URL="http://localhost:3004"
NOTIFICATION_SERVICE_URL="http://localhost:3005"
ANALYTICS_SERVICE_URL="http://localhost:3006"

# Frontend
REACT_APP_API_BASE_URL="https://yourdomain.com/api"
REACT_APP_BOT_USERNAME="@your_bot_username"

# Production
NODE_ENV="production"
PORT="3000"
```

### 3. Установка зависимостей
```bash
# Root dependencies
npm install

# Web App
cd apps/web-app
npm install
cd ../..

# Bot Service (основной сервис)
cd services/bot-service
npm install
cd ../..

# Course Service
cd services/course-service
npm install
cd ../..

# Auth Service
cd services/auth-service
npm install
cd ../..
```

## 🏗️ Сборка проекта

### 1. Инициализация баз данных
```bash
# Bot Service database
cd services/bot-service
npx prisma generate
npx prisma db push
cd ../..

# Course Service database  
cd services/course-service
npx prisma generate
npx prisma db push
cd ../..

# Auth Service database
cd services/auth-service
npx prisma generate
npx prisma db push
cd ../..
```

### 2. Сборка frontend
```bash
cd apps/web-app
npm run build
cd ../..
```

## 🚀 Запуск сервисов

### Метод 1: Использование Docker Compose (рекомендуется)
```bash
# Запуск всех сервисов
docker-compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker-compose ps
```

### Метод 2: Запуск через PM2
```bash
# Установка PM2
sudo npm install -g pm2

# Запуск сервисов
pm2 start ecosystem.config.js --env production

# Проверка статуса
pm2 status
pm2 logs
```

## 🌐 Настройка Nginx

### 1. Создание конфигурации
```bash
sudo nano /etc/nginx/sites-available/gongbu-platform
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend
    location / {
        root /var/www/gongbu-platform/apps/web-app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API Gateway
    location /api/ {
        proxy_pass http://localhost:3007/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Telegram Webhook
    location /webhook {
        proxy_pass http://localhost:3003/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /uploads {
        root /var/www/gongbu-platform;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Активация сайта
```bash
sudo ln -s /etc/nginx/sites-available/gongbu-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. SSL сертификат
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🤖 Настройка Telegram Bot

### 1. Создание бота через @BotFather
1. Отправьте `/newbot` боту @BotFather
2. Следуйте инструкциям
3. Скопируйте токен в `.env` файл

### 2. Настройка WebApp
```bash
# Установка Menu Button для бота
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setChatMenuButton" \
     -H "Content-Type: application/json" \
     -d '{
       "menu_button": {
         "type": "web_app",
         "text": "🎓 Открыть курсы",
         "web_app": {
           "url": "https://yourdomain.com/student"
         }
       }
     }'
```

### 3. Настройка Webhook
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/webhook"}'
```

## 📊 Мониторинг и логи

### 1. Проверка здоровья сервисов
```bash
# Health checks
curl https://yourdomain.com/api/health
curl http://localhost:3003/health  # Bot Service
curl http://localhost:3002/health  # Course Service
curl http://localhost:3001/health  # Auth Service
```

### 2. Просмотр логов
```bash
# PM2 logs
pm2 logs --lines 100

# Docker logs
docker-compose logs -f --tail=100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Безопасность

### 1. Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Обновления безопасности
```bash
# Автоматические обновления
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### 3. Бэкапы базы данных
```bash
# Создание скрипта бэкапа
cat > /var/www/gongbu-platform/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/gongbu"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U gongbu_user gongbu_platform > $BACKUP_DIR/db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/gongbu-platform

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /var/www/gongbu-platform/backup.sh

# Добавление в cron
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/gongbu-platform/backup.sh") | crontab -
```

## 🚀 Финальные шаги

### 1. Проверка всех компонентов
- ✅ Nginx работает и отдает frontend
- ✅ API endpoints отвечают
- ✅ База данных подключена
- ✅ Telegram bot отвечает на команды
- ✅ WebApp открывается через бота
- ✅ SSL сертификат установлен

### 2. Тестирование платформы
1. Откройте https://yourdomain.com
2. Зарегистрируйтесь как эксперт
3. Создайте тестовый курс
4. Запустите бота в Telegram: /start
5. Откройте WebApp из бота
6. Протестируйте прохождение курса

## 🆘 Troubleshooting

### Частые проблемы:

**1. "Cannot connect to database"**
```bash
# Проверьте статус PostgreSQL
sudo systemctl status postgresql

# Проверьте строку подключения в .env
psql -h localhost -U gongbu_user -d gongbu_platform
```

**2. "Telegram webhook failed"**
```bash
# Проверьте webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Переустановите webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://yourdomain.com/webhook"
```

**3. "Frontend не загружается"**
```bash
# Проверьте сборку
cd apps/web-app && npm run build

# Проверьте Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📞 Поддержка

После развертывания все компоненты будут доступны:
- **Frontend**: https://yourdomain.com
- **API**: https://yourdomain.com/api
- **Bot Admin**: https://yourdomain.com/admin
- **Health Check**: https://yourdomain.com/api/health

**Платформа готова к использованию в продакшене!** 🚀
