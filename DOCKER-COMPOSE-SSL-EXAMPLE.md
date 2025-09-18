# 🔒 Обновления Docker Compose для поддержки SSL

## 📋 Дополнения к docker-compose.simple.yml

Для поддержки вашей профессиональной nginx.conf конфигурации с SSL, добавьте в секцию `nginx`:

```yaml
nginx:
  image: nginx:alpine
  container_name: gongbu_nginx
  ports:
    - "80:80"
    - "443:443"  # <-- Добавить HTTPS порт
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/html:/usr/share/nginx/html        # <-- Для ACME challenge
    - ./letsencrypt:/etc/letsencrypt:ro         # <-- Для SSL сертификатов
  depends_on:
    - web-app
    - bot-service
  restart: unless-stopped
  networks:
    - gongbu_network
```

## 🔧 Подготовка директорий

```bash
# На VPS создайте необходимые директории:
mkdir -p ~/gongbu-platform/nginx/html
mkdir -p ~/gongbu-platform/letsencrypt
```

## 🔒 Получение SSL сертификата

```bash
# 1. Установите certbot
sudo apt update
sudo apt install certbot

# 2. Остановите nginx временно
docker-compose -f docker-compose.simple.yml stop nginx

# 3. Получите сертификат
sudo certbot certonly --standalone -d gongbu.appletownworld.com

# 4. Скопируйте сертификаты в проект
sudo cp -r /etc/letsencrypt ~/gongbu-platform/
sudo chown -R $USER:$USER ~/gongbu-platform/letsencrypt

# 5. Замените nginx.conf вашей конфигурацией

# 6. Запустите обновленный nginx
docker-compose -f docker-compose.simple.yml up -d nginx
```

## ⚠️ Важные моменты

1. **DNS**: Убедитесь что `gongbu.appletownworld.com` указывает на ваш VPS
2. **Firewall**: Откройте порт 443: `sudo ufw allow 443`
3. **Автообновление**: Настройте cron для обновления сертификатов
4. **Backup**: Сделайте резервную копию сертификатов

## 🔄 Автообновление сертификатов

Добавьте в crontab:

```bash
# Обновление Let's Encrypt сертификатов каждые 60 дней в 3 утра
0 3 */60 * * certbot renew --quiet && docker-compose -f ~/gongbu-platform/docker-compose.simple.yml restart nginx
```

## 🎯 Результат

✅ HTTPS с автоматическим редиректом с HTTP  
✅ HTTP/2 поддержка для лучшей производительности  
✅ Безопасные заголовки  
✅ Автообновление SSL сертификатов  
✅ Production-ready конфигурация  

🏆 **Ваша конфигурация nginx.conf превосходна и полностью готова к production!**
