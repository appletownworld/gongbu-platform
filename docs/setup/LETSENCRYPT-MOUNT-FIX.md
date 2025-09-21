# 🔧 Исправление монтирования Let's Encrypt сертификатов

## 🚨 Проблема
Nginx контейнер перезапускается из-за отсутствующих SSL сертификатов. Проблема была в неправильном монтировании директории `/etc/letsencrypt`.

## ✅ Решение

### **В docker-compose.simple.yml:**
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro      # Системные сертификаты
```

### **В docker-compose.production.yml:**
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro      # Системные сертификаты (рекомендуется)
  # - ./letsencrypt:/etc/letsencrypt:ro       # Локальные сертификаты (если скопированы)
```

## 🔍 Объяснение

1. **nginx.conf** ссылается на `/etc/letsencrypt/live/gongbu.appletownworld.com/`
2. **Системный путь** `/etc/letsencrypt` содержит реальные сертификаты и symlink-и
3. **Локальный путь** `./letsencrypt` был пустым, что вызывало ошибки

## 🚀 Варианты использования

### **Вариант 1: Системные сертификаты (рекомендуется)**
```bash
# Сертификаты получены на хосте через certbot
sudo certbot certonly --standalone -d gongbu.appletownworld.com

# Docker монтирует системную директорию
- /etc/letsencrypt:/etc/letsencrypt:ro
```

### **Вариант 2: Локальные сертификаты**
```bash
# Копируем сертификаты в проект
sudo cp -r /etc/letsencrypt ./letsencrypt/
sudo chown -R $USER:$USER ./letsencrypt/

# Docker монтирует локальную директорию
- ./letsencrypt:/etc/letsencrypt:ro
```

## ⚠️ Важно

- **Symlink-и**: Let's Encrypt создает символические ссылки, которые должны быть доступны
- **Права доступа**: Убедитесь что Docker может читать сертификаты
- **Обновление**: При обновлении сертификатов перезапустите nginx контейнер

## 🔄 Проверка исправления

```bash
# Проверить монтирование
docker-compose exec nginx ls -la /etc/letsencrypt/live/

# Проверить сертификаты
docker-compose exec nginx openssl x509 -in /etc/letsencrypt/live/gongbu.appletownworld.com/fullchain.pem -text -noout

# Проверить логи nginx
docker-compose logs nginx
```
