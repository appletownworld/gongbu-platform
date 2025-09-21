# 🚀 Production Docker Compose Guide

## 📋 Обзор

`docker-compose.production.yml` - это улучшенная конфигурация, объединяющая лучшие практики безопасности с полной функциональностью платформы.

## 🏆 Ключевые улучшения

### 🔒 **Безопасность**
- **expose вместо ports** - внутренние сервисы недоступны извне
- **Только nginx открыт** наружу (порты 80/443)
- **Минимизация атакующей поверхности**
- **Изоляция сервисов** в внутренней сети

### ⚡ **Производительность**
- **Быстрые health checks** (5s vs 30s) - быстрее детекция проблем
- **Агрессивные таймауты** - система быстрее восстанавливается
- **Оптимизированная сетевая модель**

### 🔧 **Гибкость**
- **Гибкие пути** к nginx.conf и SSL сертификатам
- **Модульная архитектура** - легко адаптировать под нужды
- **Совместимость** с существующими настройками

## 📁 Структура проекта

```
~/gongbu-platform/
├── docker-compose.production.yml    # Производственная конфигурация
├── docker-compose.simple.yml        # Базовая конфигурация (для разработки)
├── nginx.conf                       # Ваша профессиональная конфигурация nginx
├── nginx/
│   ├── html/                        # Для ACME challenge (Let's Encrypt)
│   └── nginx.conf                   # Альтернативное расположение конфигурации
├── letsencrypt/                     # SSL сертификаты Let's Encrypt (в проекте)
├── .env                             # Переменные окружения
└── services/                        # Исходный код микросервисов
```

## ⚙️ Конфигурация

### 1️⃣ **Выбор расположения nginx.conf**

**Вариант A: nginx.conf в корне проекта (по умолчанию)**
```yaml
- ./nginx.conf:/etc/nginx/nginx.conf:ro
```

**Вариант B: nginx.conf в папке nginx/**
```yaml
# Раскомментируйте эту строку:
- ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
# И закомментируйте основную:
# - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

### 2️⃣ **Выбор источника SSL сертификатов**

**Вариант A: SSL сертификаты в проекте (по умолчанию)**
```yaml
- ./letsencrypt:/etc/letsencrypt:ro
```

**Вариант B: Системные SSL сертификаты**
```yaml
# Раскомментируйте эту строку:
- /etc/letsencrypt:/etc/letsencrypt:ro
# И закомментируйте проектную:
# - ./letsencrypt:/etc/letsencrypt:ro
```

## 🚀 Развертывание

### **Локальное тестирование**
```bash
# Остановить текущие контейнеры
docker-compose -f docker-compose.simple.yml down

# Запустить production конфигурацию
docker-compose -f docker-compose.production.yml up -d --build

# Проверить статус
docker-compose -f docker-compose.production.yml ps

# Проверить логи
docker-compose -f docker-compose.production.yml logs
```

### **Обновление автодеплоя**

Обновите `.github/workflows/deploy.yml`:

```yaml
# Заменить эти строки:
docker-compose -f docker-compose.simple.yml down
docker-compose -f docker-compose.simple.yml up -d --build

# На эти:
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

## 🔧 Health Checks

### **Быстрые health checks для nginx**
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://localhost/health || exit 1"]
  interval: 5s      # Проверка каждые 5 секунд
  timeout: 3s       # Таймаут 3 секунды
  retries: 12       # 12 попыток = 1 минута на восстановление
```

### **Стандартные health checks для сервисов**
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`
- **Микросервисы**: HTTP endpoints `/health`

## 🌐 Сетевая архитектура

```
Интернет
    ↓
nginx:80,443 (ЕДИНСТВЕННЫЙ ОТКРЫТЫЙ ПОРТ)
    ↓
┌─────────────── gongbu_network (внутренняя) ───────────────┐
│                                                           │
│  web-app:3000 ←→ auth-service:3001 ←→ postgres:5432     │
│       ↕               ↕                        ↕         │  
│  bot-service:3003 ←→ course-service:3002 ←→ redis:6379   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## 🔍 Мониторинг и диагностика

### **Проверка статуса сервисов**
```bash
# Общий статус
docker-compose -f docker-compose.production.yml ps

# Health статус
docker-compose -f docker-compose.production.yml ps --format "table {{.Service}}\t{{.Status}}\t{{.Health}}"

# Логи конкретного сервиса
docker-compose -f docker-compose.production.yml logs nginx
docker-compose -f docker-compose.production.yml logs web-app
```

### **Проверка доступности**
```bash
# Внешний доступ
curl -f http://VPS_IP/health

# Внутренние сервисы (только из контейнера nginx)
docker exec gongbu_nginx wget -q --spider http://web-app:3000/health
docker exec gongbu_nginx wget -q --spider http://bot-service:3003/health
```

## ⚠️ Важные замечания

### **Безопасность**
- ✅ Внутренние порты недоступны извне
- ✅ Только nginx принимает внешние подключения
- ✅ Все межсервисные коммуникации происходят в изолированной сети

### **SSL сертификаты**
- 🔧 Выберите подходящий вариант монтирования сертификатов
- 🔄 При использовании системных сертификатов убедитесь в правах доступа
- 🔒 Сертификаты должны быть доступны на чтение контейнеру nginx

### **Совместимость**
- ✅ Полностью совместим с существующими переменными окружения
- ✅ Сохраняет всю функциональность платформы
- ✅ Работает с вашей профессиональной nginx конфигурацией

## 🎯 Результат

После развертывания production конфигурации вы получаете:

- 🔒 **Максимальную безопасность** - только nginx доступен извне
- ⚡ **Быстрое восстановление** - агрессивные health checks
- 🏗️ **Масштабируемую архитектуру** - готовность к расширению
- 🎨 **Вашу профессиональную nginx конфигурацию** с SSL/HTTP2/ACME
- 💪 **Enterprise-уровень** готовности к производственной эксплуатации

**🏆 Это идеальное сочетание безопасности, производительности и функциональности!**
