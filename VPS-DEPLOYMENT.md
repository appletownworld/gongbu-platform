# 🚀 Gongbu Platform - VPS Deployment Guide

Полное руководство по развертыванию образовательной платформы Gongbu на VPS сервере.

## 📋 Требования к серверу

### Минимальные требования:
- **RAM**: 4GB (рекомендуется 8GB+)
- **CPU**: 2 ядра (рекомендуется 4+)
- **Диск**: 50GB SSD (рекомендуется 100GB+)
- **ОС**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Сеть**: статический IP и домен

### Рекомендуемые VPS провайдеры:
- **DigitalOcean** - от $20/месяц
- **Hetzner** - от €15/месяц  
- **Vultr** - от $20/месяц
- **Amazon EC2** - от $25/месяц

## 🛠️ Пошаговое развертывание

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y curl wget git unzip

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker

# Настройка firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 2. Клонирование проекта

```bash
# Клонирование репозитория
git clone https://github.com/your-username/gongbu-platform.git
cd gongbu-platform

# Или загрузка архива
wget https://github.com/your-username/gongbu-platform/archive/main.zip
unzip main.zip
mv gongbu-platform-main gongbu-platform
cd gongbu-platform
```

### 3. Настройка окружения

```bash
# Копирование .env файла
cp .env.production .env

# Редактирование конфигурации
nano .env
```

**Обязательные параметры для изменения:**

```env
# === ДОМЕН И URL ===
DOMAIN_NAME=your-domain.com
API_BASE_URL=https://your-domain.com/api
WEBHOOK_URL=https://your-domain.com/webhook

# === БЕЗОПАСНОСТЬ ===
POSTGRES_PASSWORD=your_very_secure_password_here
REDIS_PASSWORD=your_redis_password_here  
JWT_SECRET=your_32_character_jwt_secret_key_here

# === TELEGRAM ===
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
ADMIN_USER_IDS=123456789,987654321

# === EMAIL (опционально) ===
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
EMAIL_FROM=noreply@your-domain.com
```

### 4. Настройка DNS

В панели управления доменом добавьте A-записи:

```
@ (или your-domain.com)     → IP_ADDRESS_VPS
www                         → IP_ADDRESS_VPS
api                         → IP_ADDRESS_VPS
```

### 5. Запуск платформы

```bash
# Запуск автоматического развертывания
./deploy.sh
```

**Или ручной запуск:**

```bash
# Создание директорий
mkdir -p infrastructure/nginx infrastructure/monitoring backups

# Запуск сервисов
docker-compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps
```

### 6. Настройка SSL (HTTPS)

```bash
# Установка Certbot
sudo apt install -y snapd
sudo snap install --classic certbot

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автообновление сертификатов
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Управление платформой

### Полезные команды:

```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# Перезапуск сервиса
docker-compose -f docker-compose.prod.yml restart [service_name]

# Обновление платформы
git pull origin main
./deploy.sh

# Резервное копирование БД
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres gongbu_prod > backup.sql

# Восстановление БД
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres gongbu_prod

# Проверка здоровья сервисов
./health-check.sh

# Остановка всех сервисов
docker-compose -f docker-compose.prod.yml down
```

### Мониторинг и логи:

- **Grafana**: `https://your-domain.com/grafana` (admin/пароль_из_.env)
- **Логи**: `docker-compose -f docker-compose.prod.yml logs -f`
- **Статус**: `docker-compose -f docker-compose.prod.yml ps`

## 🛡️ Безопасность

### Дополнительные меры безопасности:

```bash
# Изменение SSH порта
sudo nano /etc/ssh/sshd_config
# Port 2222
sudo systemctl restart sshd
sudo ufw allow 2222/tcp

# Отключение root логина
sudo passwd -l root

# Настройка Fail2Ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Автоматические обновления
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## 📊 Мониторинг производительности

### Ключевые метрики для отслеживания:

- **CPU**: < 80%
- **RAM**: < 85%
- **Disk**: < 90%
- **Response Time**: < 500ms
- **Database Connections**: < 80% от лимита

### Алерты и уведомления:

```bash
# Настройка алертов в Grafana
# Dashboard → Alerting → Notification channels
# Добавить Telegram/Email уведомления
```

## 🔄 Резервное копирование

### Автоматический бэкап:

```bash
# Создание скрипта бэкапа
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"

# База данных
docker-compose exec postgres pg_dump -U postgres gongbu_prod > $BACKUP_DIR/db_$DATE.sql

# Загруженные файлы
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz course_uploads/

# Удаление старых бэкапов (> 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# Добавление в cron (ежедневно в 2:00)
crontab -e
# 0 2 * * * /home/$USER/gongbu-platform/backup.sh
```

## 🚨 Устранение проблем

### Частые проблемы:

**1. Сервис не запускается:**
```bash
docker-compose -f docker-compose.prod.yml logs [service_name]
docker-compose -f docker-compose.prod.yml restart [service_name]
```

**2. Нет доступа к сайту:**
```bash
# Проверка Nginx
docker-compose -f docker-compose.prod.yml logs nginx
sudo ufw status
```

**3. Telegram бот не работает:**
```bash
# Проверка токена и webhook
docker-compose -f docker-compose.prod.yml logs bot-service
curl -X GET "https://api.telegram.org/bot{BOT_TOKEN}/getMe"
```

**4. База данных недоступна:**
```bash
# Проверка PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -l
```

## 🎯 После развертывания

### Что можно делать:

1. **Веб-интерфейс**: `https://your-domain.com`
2. **Telegram бот**: найти по username
3. **Админ-панель**: `https://your-domain.com/admin`
4. **API документация**: `https://your-domain.com/api/docs`
5. **Мониторинг**: `https://your-domain.com/grafana`

### Следующие шаги:

- [ ] Создать первого админа
- [ ] Добавить курсы через админ-панель
- [ ] Настроить платежную систему
- [ ] Провести нагрузочное тестирование
- [ ] Настроить CDN для статических файлов
- [ ] Добавить дополнительные алерты

---

## 🎉 Поздравляем!

Платформа Gongbu успешно развернута на VPS! 

**Техподдержка**: Если возникли проблемы, проверьте логи и статус сервисов.

**Масштабирование**: При росте нагрузки можно легко добавить дополнительные серверы через Docker Swarm или Kubernetes.
