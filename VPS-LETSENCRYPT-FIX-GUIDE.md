# 🔧 Исправление Let's Encrypt на VPS - Пошаговая инструкция

## 🚨 Проблема
Nginx контейнер перезапускается из-за неправильного монтирования SSL сертификатов Let's Encrypt в docker-compose файлах.

## ✅ Решение на VPS

### 📋 **Вариант 1: Автоматическое обновление через GitHub Actions (рекомендуется)**

```bash
# 1. Подключитесь к VPS
ssh your-user@your-vps-ip

# 2. Перейдите в директорию проекта
cd ~/gongbu-platform

# 3. Получите последние изменения из репозитория
git fetch origin
git reset --hard origin/main

# 4. Перезапустите контейнеры с исправленной конфигурацией
docker-compose -f docker-compose.simple.yml down
docker-compose -f docker-compose.simple.yml up -d

# 5. Проверьте статус nginx
docker-compose -f docker-compose.simple.yml logs nginx
```

### 📋 **Вариант 2: Ручное обновление файлов**

#### Шаг 1: Подключение к VPS
```bash
ssh your-user@your-vps-ip
cd ~/gongbu-platform
```

#### Шаг 2: Остановка текущих контейнеров
```bash
# Остановите все контейнеры
docker-compose -f docker-compose.simple.yml down

# Проверьте что все остановлено
docker ps
```

#### Шаг 3: Обновление docker-compose.simple.yml
```bash
# Создайте резервную копию
cp docker-compose.simple.yml docker-compose.simple.yml.backup

# Откройте файл для редактирования
nano docker-compose.simple.yml
```

**Найдите секцию nginx volumes и убедитесь что она выглядит так:**
```yaml
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
  - ./nginx/html:/usr/share/nginx/html        # For ACME challenge (Let's Encrypt)
  - /etc/letsencrypt:/etc/letsencrypt:ro      # For SSL certificates (system path)
  # Alternative: use local project certificates if copied from system
  # - ./letsencrypt:/etc/letsencrypt:ro       # For SSL certificates (project path)
```

#### Шаг 4: Обновление docker-compose.production.yml (если используется)
```bash
# Откройте production файл
nano docker-compose.production.yml
```

**Найдите секцию SSL certificates и измените на:**
```yaml
# SSL certificates (выберите подходящий вариант)
# - ./letsencrypt:/etc/letsencrypt:ro                      # Вариант 1: SSL в проекте (если скопированы из системы)
- /etc/letsencrypt:/etc/letsencrypt:ro                     # Вариант 2: Системные SSL (рекомендуется для production)
```

#### Шаг 5: Проверка SSL сертификатов
```bash
# Проверьте что сертификаты существуют в системе
sudo ls -la /etc/letsencrypt/live/

# Проверьте ваш домен (замените на свой)
sudo ls -la /etc/letsencrypt/live/gongbu.appletownworld.com/

# Проверьте права доступа
sudo ls -la /etc/letsencrypt/
```

#### Шаг 6: Создание необходимых директорий
```bash
# Создайте директории если не существуют
mkdir -p nginx/html
mkdir -p letsencrypt  # На случай если понадобится локальная копия

# Проверьте структуру
ls -la nginx/
```

#### Шаг 7: Запуск обновленных контейнеров
```bash
# Запустите с пересборкой
docker-compose -f docker-compose.simple.yml up -d --build

# Проверьте статус всех контейнеров
docker-compose -f docker-compose.simple.yml ps

# Проверьте логи nginx (должен запуститься без ошибок)
docker-compose -f docker-compose.simple.yml logs nginx
```

## 🔍 **Диагностика и проверка**

### Проверка монтирования сертификатов
```bash
# Войдите в контейнер nginx
docker-compose -f docker-compose.simple.yml exec nginx sh

# Внутри контейнера проверьте сертификаты
ls -la /etc/letsencrypt/live/
ls -la /etc/letsencrypt/live/gongbu.appletownworld.com/

# Проверьте что файлы доступны
cat /etc/letsencrypt/live/gongbu.appletownworld.com/fullchain.pem | head -5

# Выйдите из контейнера
exit
```

### Проверка работы nginx
```bash
# Проверьте статус nginx
docker-compose -f docker-compose.simple.yml logs nginx --tail=20

# Проверьте что nginx не перезапускается
docker-compose -f docker-compose.simple.yml ps nginx

# Проверьте health check
curl -I http://localhost/health
curl -I https://your-domain.com/health
```

### Проверка SSL сертификата
```bash
# Проверьте SSL сертификат через openssl
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null

# Или через curl
curl -I https://your-domain.com/health
```

## 🚨 **Устранение проблем**

### Если nginx все еще перезапускается:

1. **Проверьте логи nginx:**
```bash
docker-compose -f docker-compose.simple.yml logs nginx --tail=50
```

2. **Проверьте права доступа к сертификатам:**
```bash
sudo ls -la /etc/letsencrypt/live/your-domain.com/
sudo ls -la /etc/letsencrypt/archive/your-domain.com/
```

3. **Проверьте что Docker может читать сертификаты:**
```bash
# Добавьте пользователя в группу docker если нужно
sudo usermod -aG docker $USER
# Перелогиньтесь после этого

# Проверьте группы пользователя
groups $USER
```

### Если сертификаты отсутствуют:

1. **Получите новые сертификаты:**
```bash
# Остановите nginx временно
docker-compose -f docker-compose.simple.yml stop nginx

# Получите сертификат через certbot
sudo certbot certonly --standalone -d your-domain.com

# Запустите nginx обратно
docker-compose -f docker-compose.simple.yml start nginx
```

2. **Или скопируйте сертификаты в проект:**
```bash
# Скопируйте системные сертификаты в проект
sudo cp -r /etc/letsencrypt ./letsencrypt/
sudo chown -R $USER:$USER ./letsencrypt/

# Измените docker-compose.yml чтобы использовать локальную копию
# - ./letsencrypt:/etc/letsencrypt:ro
```

## ✅ **Проверка успешного исправления**

После применения исправлений:

1. **Nginx должен запуститься и не перезапускаться**
2. **SSL сертификаты должны быть доступны в контейнере**
3. **HTTPS должен работать без ошибок**
4. **Health check должен возвращать 200 OK**

```bash
# Финальная проверка
echo "🔍 Проверка статуса всех сервисов:"
docker-compose -f docker-compose.simple.yml ps

echo "🔍 Проверка nginx логов:"
docker-compose -f docker-compose.simple.yml logs nginx --tail=10

echo "🔍 Проверка HTTPS:"
curl -I https://your-domain.com/health

echo "✅ Если все команды выше прошли успешно - проблема решена!"
```

## 📚 **Дополнительные ресурсы**

- [LETSENCRYPT-MOUNT-FIX.md](./LETSENCRYPT-MOUNT-FIX.md) - Техническое объяснение проблемы
- [TROUBLESHOOTING-NETWORK.md](./TROUBLESHOOTING-NETWORK.md) - Диагностика сетевых проблем
- [VPS-DEPLOYMENT.md](./VPS-DEPLOYMENT.md) - Полное руководство по развертыванию

## 🆘 **Если ничего не помогает**

1. Проверьте логи всех контейнеров: `docker-compose logs`
2. Проверьте системные ресурсы: `df -h && free -h`
3. Перезапустите Docker: `sudo systemctl restart docker`
4. Обратитесь к документации или создайте issue в репозитории
