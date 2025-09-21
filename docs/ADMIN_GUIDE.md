# Руководство администратора Gongbu Platform

## Содержание
1. [Введение](#введение)
2. [Установка и настройка](#установка-и-настройка)
3. [Управление системой](#управление-системой)
4. [Мониторинг](#мониторинг)
5. [Безопасность](#безопасность)
6. [Резервное копирование](#резервное-копирование)
7. [Обновления](#обновления)
8. [Устранение неполадок](#устранение-неполадок)

## Введение

Данное руководство предназначено для системных администраторов, ответственных за развертывание, настройку и поддержку Gongbu Platform в production среде.

### Архитектура системы
- **API Gateway** - единая точка входа для всех запросов
- **Auth Service** - аутентификация и авторизация
- **Course Service** - управление курсами и контентом
- **Bot Service** - Telegram бот
- **Payment Service** - обработка платежей
- **Notification Service** - уведомления
- **Analytics Service** - аналитика и отчеты
- **Plugin Service** - система плагинов

## Установка и настройка

### Требования к системе
- **ОС**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **RAM**: минимум 4GB, рекомендуется 8GB+
- **CPU**: минимум 2 ядра, рекомендуется 4+
- **Диск**: минимум 50GB свободного места
- **Docker**: версия 20.10+
- **Docker Compose**: версия 2.0+

### Установка зависимостей

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Установка дополнительных инструментов
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx
```

### Клонирование репозитория

```bash
git clone https://github.com/your-org/gongbu-platform.git
cd gongbu-platform
```

### Настройка переменных окружения

```bash
# Копирование примера конфигурации
cp env.prod.example .env.prod

# Редактирование конфигурации
nano .env.prod
```

### Обязательные переменные

```bash
# База данных
POSTGRES_PASSWORD=your_secure_password_here
REDIS_PASSWORD=your_redis_password_here

# JWT
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_characters

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Домен
DOMAIN=your-domain.com
EMAIL=admin@your-domain.com
```

### Развертывание

```bash
# Запуск развертывания
./deploy.sh

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps
```

## Управление системой

### Основные команды

```bash
# Запуск всех сервисов
docker-compose -f docker-compose.prod.yml up -d

# Остановка всех сервисов
docker-compose -f docker-compose.prod.yml down

# Перезапуск сервиса
docker-compose -f docker-compose.prod.yml restart api-gateway

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f auth-service
```

### Управление базами данных

```bash
# Подключение к PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d gongbu_prod

# Создание резервной копии
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres gongbu_prod > backup.sql

# Восстановление из резервной копии
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres gongbu_prod < backup.sql
```

### Управление Redis

```bash
# Подключение к Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli

# Очистка кеша
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

## Мониторинг

### Health Checks

```bash
# Проверка состояния API Gateway
curl http://localhost/api/v1/health

# Проверка состояния всех сервисов
curl http://localhost/api/v1/health/services

# Проверка готовности системы
curl http://localhost/api/v1/health/ready
```

### Логи

```bash
# Просмотр всех логов
docker-compose -f docker-compose.prod.yml logs --tail=100

# Логи с фильтрацией по уровню
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep ERROR

# Логи за определенный период
docker-compose -f docker-compose.prod.yml logs --since="2025-09-21T10:00:00"
```

### Метрики

```bash
# Базовые метрики API Gateway
curl http://localhost/api/v1/health/metrics

# Использование ресурсов
docker stats

# Использование диска
df -h
```

### Настройка мониторинга

Для production рекомендуется настроить:

1. **Prometheus** - сбор метрик
2. **Grafana** - визуализация
3. **ELK Stack** - централизованное логирование
4. **AlertManager** - уведомления о проблемах

## Безопасность

### SSL/TLS

```bash
# Получение SSL сертификата
certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматическое обновление
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Firewall

```bash
# Настройка UFW
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000:3010/tcp  # Блокировка прямого доступа к сервисам
```

### Обновление паролей

```bash
# Генерация безопасных паролей
openssl rand -base64 32

# Обновление переменных окружения
nano .env.prod

# Перезапуск сервисов
docker-compose -f docker-compose.prod.yml restart
```

### Аудит безопасности

```bash
# Проверка уязвимостей в образах
docker scout cves gongbu_local-api-gateway

# Анализ логов на подозрительную активность
docker-compose -f docker-compose.prod.yml logs | grep -i "error\|fail\|unauthorized"
```

## Резервное копирование

### Автоматическое резервное копирование

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/gongbu"

# Создание директории
mkdir -p $BACKUP_DIR

# Резервная копия базы данных
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres gongbu_prod > $BACKUP_DIR/db_$DATE.sql

# Резервная копия загруженных файлов
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Резервная копия конфигурации
cp .env.prod $BACKUP_DIR/env_$DATE.prod

# Удаление старых резервных копий (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.prod" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Настройка cron

```bash
# Добавление в crontab
echo "0 2 * * * /path/to/backup.sh" | sudo crontab -
```

## Обновления

### Обновление приложения

```bash
# Получение последних изменений
git pull origin main

# Пересборка образов
docker-compose -f docker-compose.prod.yml build --no-cache

# Остановка сервисов
docker-compose -f docker-compose.prod.yml down

# Запуск с новыми образами
docker-compose -f docker-compose.prod.yml up -d

# Проверка работоспособности
curl http://localhost/api/v1/health
```

### Обновление зависимостей

```bash
# Обновление системных пакетов
sudo apt update && sudo apt upgrade -y

# Обновление Docker
sudo apt install docker-ce docker-ce-cli containerd.io

# Обновление Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

## Устранение неполадок

### Частые проблемы

#### Сервис не запускается
```bash
# Проверка логов
docker-compose -f docker-compose.prod.yml logs service-name

# Проверка конфигурации
docker-compose -f docker-compose.prod.yml config

# Проверка ресурсов
docker stats
```

#### База данных недоступна
```bash
# Проверка состояния PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Проверка подключений
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

#### Высокое использование памяти
```bash
# Анализ использования памяти
docker stats --no-stream

# Очистка неиспользуемых ресурсов
docker system prune -a

# Перезапуск сервисов
docker-compose -f docker-compose.prod.yml restart
```

#### Медленная работа
```bash
# Проверка производительности
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/api/v1/health

# Анализ логов на медленные запросы
docker-compose -f docker-compose.prod.yml logs | grep "slow request"
```

### Диагностические команды

```bash
# Проверка сетевых подключений
docker network ls
docker network inspect gongbu_network

# Проверка томов
docker volume ls
docker volume inspect gongbu_postgres_data

# Проверка процессов
docker-compose -f docker-compose.prod.yml top
```

### Восстановление после сбоя

```bash
# Полная перезагрузка системы
docker-compose -f docker-compose.prod.yml down
docker system prune -a
docker-compose -f docker-compose.prod.yml up -d

# Восстановление из резервной копии
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres gongbu_prod < backup.sql
docker-compose -f docker-compose.prod.yml up -d
```

## Контакты поддержки

- **Техническая поддержка**: admin@gongbu.app
- **Документация**: [docs.gongbu.app](https://docs.gongbu.app)
- **GitHub Issues**: [github.com/your-org/gongbu-platform/issues](https://github.com/your-org/gongbu-platform/issues)

---

*Последнее обновление: Сентябрь 2025*
