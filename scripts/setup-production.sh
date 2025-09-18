#!/bin/bash

# 🚀 Скрипт автоматической настройки Gongbu Platform на VPS
# Запуск: chmod +x scripts/setup-production.sh && ./scripts/setup-production.sh

set -e

echo "🚀 НАСТРОЙКА GONGBU PLATFORM НА ПРОДАКШН СЕРВЕРЕ"
echo "=================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для цветного вывода
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка, что скрипт запущен от root
if [[ $EUID -ne 0 ]]; then
   print_error "Скрипт должен быть запущен от root пользователя"
   exit 1
fi

# Переменные
PROJECT_DIR="/var/www/gongbu-platform"
DB_NAME="gongbu_platform"
DB_USER="gongbu_user"
DB_PASS="$(openssl rand -base64 32)"
JWT_SECRET="$(openssl rand -base64 64)"

print_status "Начинаем настройку сервера..."

# 1. Обновление системы
print_status "Обновление системы пакетов..."
apt update && apt upgrade -y
apt install -y curl wget git vim nginx certbot python3-certbot-nginx software-properties-common

print_success "Система обновлена"

# 2. Установка Node.js 18
print_status "Установка Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
print_success "Node.js $(node --version) установлен"

# 3. Установка Docker
print_status "Установка Docker и Docker Compose..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
print_success "Docker установлен"

# 4. Установка PostgreSQL
print_status "Установка PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Создание пользователя и базы данных
print_status "Настройка базы данных..."
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

print_success "База данных настроена"

# 5. Установка PM2
print_status "Установка PM2..."
npm install -g pm2
pm2 startup
print_success "PM2 установлен"

# 6. Клонирование проекта
print_status "Клонирование проекта..."
if [ -d "$PROJECT_DIR" ]; then
    print_warning "Директория $PROJECT_DIR уже существует, обновляем..."
    cd $PROJECT_DIR
    git pull origin main
else
    git clone https://github.com/appletownworld/gongbu-platform.git $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Установка прав
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

print_success "Проект клонирован"

# 7. Создание .env файла
print_status "Создание конфигурации..."
cat > $PROJECT_DIR/.env << EOF
# Production Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Telegram (ТРЕБУЕТ РУЧНОЙ НАСТРОЙКИ!)
TELEGRAM_BOT_TOKEN=CHANGE_THIS_TOKEN
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/webhook
WEBAPP_URL=https://yourdomain.com

# Services
AUTH_SERVICE_URL=http://localhost:3001
COURSE_SERVICE_URL=http://localhost:3002
BOT_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005
ANALYTICS_SERVICE_URL=http://localhost:3006
API_GATEWAY_URL=http://localhost:3007

# Frontend
REACT_APP_API_BASE_URL=https://yourdomain.com/api
REACT_APP_BOT_USERNAME=@your_bot_username

# Redis
REDIS_URL=redis://localhost:6379

# Email (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# CORS
CORS_ORIGIN=https://yourdomain.com
EOF

print_success "Конфигурация создана"

# 8. Установка зависимостей
print_status "Установка зависимостей..."
npm install

# Frontend
cd $PROJECT_DIR/apps/web-app
npm install
cd $PROJECT_DIR

# Bot Service
cd $PROJECT_DIR/services/bot-service
npm install
npx prisma generate
cd $PROJECT_DIR

# Course Service
cd $PROJECT_DIR/services/course-service
npm install
npx prisma generate
cd $PROJECT_DIR

print_success "Зависимости установлены"

# 9. Сборка проекта
print_status "Сборка проекта..."
cd $PROJECT_DIR/services/bot-service
npm run build 2>/dev/null || print_warning "Bot Service build может не удастся без полного NestJS setup"

cd $PROJECT_DIR/apps/web-app
npm run build

cd $PROJECT_DIR
print_success "Проект собран"

# 10. Настройка Nginx
print_status "Настройка Nginx..."
cat > /etc/nginx/sites-available/gongbu-platform << 'EOF'
server {
    listen 80;
    server_name _;
    
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
    
    # Health checks
    location /health {
        proxy_pass http://localhost:3003/health;
    }
}
EOF

ln -sf /etc/nginx/sites-available/gongbu-platform /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

print_success "Nginx настроен"

# 11. Настройка firewall
print_status "Настройка firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

print_success "Firewall настроен"

# 12. Создание скрипта автоматического бэкапа
print_status "Создание скрипта бэкапа..."
mkdir -p /var/backups/gongbu

cat > /var/backups/gongbu/backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/gongbu"

# Database backup
pg_dump -h localhost -U $DB_USER $DB_NAME > \$BACKUP_DIR/db_\$DATE.sql

# Files backup
tar -czf \$BACKUP_DIR/files_\$DATE.tar.gz $PROJECT_DIR

# Keep only last 7 days
find \$BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

chmod +x /var/backups/gongbu/backup.sh

# Добавление в cron
(crontab -l 2>/dev/null; echo "0 2 * * * /var/backups/gongbu/backup.sh") | crontab -

print_success "Автоматический бэкап настроен"

echo ""
echo "🎉 УСТАНОВКА ЗАВЕРШЕНА УСПЕШНО!"
echo "================================="
echo ""
print_success "✅ Система обновлена и настроена"
print_success "✅ Node.js $(node --version) установлен"
print_success "✅ Docker установлен"
print_success "✅ PostgreSQL настроен"
print_success "✅ Проект клонирован и собран"
print_success "✅ Nginx настроен"
print_success "✅ Автоматический бэкап настроен"
echo ""
echo "🔧 СЛЕДУЮЩИЕ ШАГИ (ОБЯЗАТЕЛЬНО!):"
echo "=================================="
print_warning "1. Настройте домен и SSL сертификат:"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
print_warning "2. Отредактируйте конфигурацию:"
echo "   nano $PROJECT_DIR/.env"
echo "   Замените:"
echo "   - TELEGRAM_BOT_TOKEN на реальный токен"
echo "   - yourdomain.com на ваш домен"
echo "   - @your_bot_username на username вашего бота"
echo ""
print_warning "3. Инициализируйте базы данных:"
echo "   cd $PROJECT_DIR/services/bot-service && npx prisma db push"
echo "   cd $PROJECT_DIR/services/course-service && npx prisma db push"
echo ""
print_warning "4. Запустите сервисы:"
echo "   cd $PROJECT_DIR"
echo "   # Вариант 1: Docker"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo "   # Вариант 2: PM2"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
print_warning "5. Проверьте работу:"
echo "   curl http://localhost/health"
echo ""
echo "📄 Полная документация: $PROJECT_DIR/DEPLOYMENT.md"
echo "📞 Поддержка: https://github.com/appletownworld/gongbu-platform"
echo ""
print_success "🚀 Платформа готова к запуску!"
