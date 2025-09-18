# 🚨 УСТРАНЕНИЕ ПРОБЛЕМ СЕТЕВОЙ ДОСТУПНОСТИ

## ❌ ПРОБЛЕМА
После успешной сборки Docker контейнеров, сервисы не отвечают на health checks:
- `curl: (7) Failed to connect to *** port 443`
- `curl: (7) Failed to connect to *** port 80`

## 🔍 ДИАГНОСТИКА (выполните на VPS)

### 1. 🐳 Проверка статуса контейнеров
```bash
cd ~/gongbu-platform
docker-compose -f docker-compose.simple.yml ps
```

**Ожидаемый результат:** Все контейнеры должны быть "Up"
```
NAME                STATUS              PORTS
nginx               Up 5 minutes        0.0.0.0:80->80/tcp
web-app             Up 5 minutes        3000/tcp
auth-service        Up 5 minutes        3001/tcp
course-service      Up 5 minutes        3002/tcp
bot-service         Up 5 minutes        3003/tcp
postgres            Up 5 minutes        5432/tcp
redis               Up 5 minutes        6379/tcp
```

### 2. 📊 Проверка логов при проблемах
```bash
# Если контейнеры не запущены, смотрим логи
docker-compose -f docker-compose.simple.yml logs --tail=50

# Проверка конкретных сервисов
docker-compose -f docker-compose.simple.yml logs nginx
docker-compose -f docker-compose.simple.yml logs web-app
```

### 3. 🔌 Проверка открытых портов
```bash
# Проверка что порты слушаются
sudo netstat -tlnp | grep -E ':80 |:443 '
# или
sudo ss -tlnp | grep -E ':80 |:443 '
```

**Ожидаемый результат:**
```
tcp 0.0.0.0:80 0.0.0.0:* LISTEN 12345/docker-proxy
```

### 4. 🚪 Проверка firewall
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL  
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=80/tcp --permanent
sudo firewall-cmd --add-port=443/tcp --permanent
sudo firewall-cmd --reload
```

### 5. 🌐 Проверка DNS и IP
```bash
# Узнать внешний IP VPS
curl ifconfig.me

# Проверить DNS записи домена
nslookup ВАШ_ДОМЕН
dig ВАШ_ДОМЕН
```

### 6. 🔧 Проверка локального подключения
```bash
# Проверка health endpoint изнутри VPS  
curl -v http://localhost:80/health
curl -v http://127.0.0.1:80/health

# Проверка Nginx
curl -v http://localhost:80/
```

## 🛠️ БЫСТРЫЕ ИСПРАВЛЕНИЯ

### Если контейнеры не запущены:
```bash
cd ~/gongbu-platform
docker-compose -f docker-compose.simple.yml down
docker-compose -f docker-compose.simple.yml up -d --build
```

### Если порты заблокированы firewall:
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --add-port=80/tcp --permanent
sudo firewall-cmd --add-port=443/tcp --permanent
sudo firewall-cmd --reload
```

### Если Nginx не настроен:
```bash
cd ~/gongbu-platform
# Nginx конфигурация должна была создаться автоматически в deploy.yml
ls -la nginx.conf
cat nginx.conf
```

## 🚀 ПЕРЕЗАПУСК СИСТЕМЫ
```bash
cd ~/gongbu-platform

# Полная очистка и перезапуск
docker-compose -f docker-compose.simple.yml down
docker system prune -f
docker-compose -f docker-compose.simple.yml up -d --build

# Ожидание запуска
sleep 30
docker-compose -f docker-compose.simple.yml ps

# Тест health check
curl -v http://localhost:80/health
```

## 📞 ПОЛУЧЕНИЕ ПОМОЩИ

Если проблема не решается, предоставьте вывод команд:
1. `docker-compose -f docker-compose.simple.yml ps`
2. `docker-compose -f docker-compose.simple.yml logs --tail=100`
3. `sudo netstat -tlnp | grep -E ':80 |:443 '`
4. `curl ifconfig.me` 
5. `nslookup ВАШ_ДОМЕН`

---

💡 **ПОМНИТЕ:** Деплой может занимать 5-10 минут после сборки контейнеров. Особенно на медленных VPS.
