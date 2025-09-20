# 🐘 Руководство по использованию MCP PostgreSQL Server в других проектах

**Дата создания:** 20 сентября 2025  
**Статус:** ✅ Готово к использованию  
**Версия MCP PostgreSQL:** 0.6.0  

---

## 🎯 **Краткий ответ: ДА, можно использовать в других проектах!**

MCP PostgreSQL Server уже установлен глобально и готов к использованию в любых проектах.

---

## 🚀 **Способы использования в других проектах**

### **Способ 1: Глобальная установка (Уже готово!)**

✅ **MCP PostgreSQL Server уже установлен глобально**  
✅ **Доступен через `npx @monsoft/mcp-postgres`**  
✅ **Работает в любом проекте**

### **Способ 2: Локальная установка в каждом проекте**

```bash
# В каждом новом проекте
npm install @monsoft/mcp-postgres
```

---

## 🔧 **Настройка для нового проекта**

### **Шаг 1: Создание конфигурации MCP**

Для каждого проекта создайте или обновите `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://user:password@localhost:5432/database_name"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### **Шаг 2: Примеры конфигураций для разных проектов**

#### **Проект 1: E-commerce платформа**
```json
{
  "mcpServers": {
    "postgres-ecommerce": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://postgres:password@localhost:5432/ecommerce_db"],
      "cwd": "/home/zebracoder/projects/ecommerce"
    }
  }
}
```

#### **Проект 2: Блог платформа**
```json
{
  "mcpServers": {
    "postgres-blog": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://postgres:password@localhost:5432/blog_db"],
      "cwd": "/home/zebracoder/projects/blog"
    }
  }
}
```

#### **Проект 3: CRM система**
```json
{
  "mcpServers": {
    "postgres-crm": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://postgres:password@localhost:5432/crm_db"],
      "cwd": "/home/zebracoder/projects/crm"
    }
  }
}
```

---

## 🎯 **Универсальная конфигурация для всех проектов**

### **Вариант А: Один сервер для всех проектов**

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://postgres:password@localhost:5432/default_db"],
      "cwd": "/home/zebracoder/projects"
    }
  }
}
```

### **Вариант Б: Множественные серверы (Рекомендуется)**

```json
{
  "mcpServers": {
    "postgres-gongbu": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://postgres:postgres@localhost:5433/gongbu_dev"],
      "cwd": "/home/zebracoder/projects/gongbu_app"
    },
    "postgres-project2": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://postgres:password@localhost:5432/project2_db"],
      "cwd": "/home/zebracoder/projects/project2"
    },
    "postgres-project3": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://postgres:password@localhost:5432/project3_db"],
      "cwd": "/home/zebracoder/projects/project3"
    }
  }
}
```

---

## 🛠️ **Практические примеры использования**

### **Пример 1: Создание нового проекта с MCP PostgreSQL**

```bash
# 1. Создаем новый проект
mkdir /home/zebracoder/projects/new_project
cd /home/zebracoder/projects/new_project

# 2. Инициализируем проект
npm init -y

# 3. Создаем PostgreSQL базу данных
docker run --name new_project_postgres -e POSTGRES_DB=new_project_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5434:5432 -d postgres:15-alpine

# 4. Обновляем конфигурацию MCP
# Добавляем в ~/.cursor/mcp.json:
```

```json
{
  "mcpServers": {
    "postgres-new-project": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://postgres:password@localhost:5434/new_project_db"],
      "cwd": "/home/zebracoder/projects/new_project"
    }
  }
}
```

### **Пример 2: Команды для работы с разными проектами**

#### **В проекте Gongbu:**
```
@mcp Покажи все таблицы в базе данных gongbu_dev
@mcp Создай таблицу users с полями id, email, created_at
```

#### **В новом проекте:**
```
@mcp Покажи все таблицы в базе данных new_project_db
@mcp Создай таблицу products с полями id, name, price, category
```

---

## 🔄 **Управление множественными базами данных**

### **Создание отдельных контейнеров для каждого проекта:**

```bash
# Проект 1: Gongbu (уже настроен)
docker run --name gongbu_postgres -e POSTGRES_DB=gongbu_dev -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres:15-alpine

# Проект 2: E-commerce
docker run --name ecommerce_postgres -e POSTGRES_DB=ecommerce_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5434:5432 -d postgres:15-alpine

# Проект 3: Blog
docker run --name blog_postgres -e POSTGRES_DB=blog_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5435:5432 -d postgres:15-alpine
```

### **Docker Compose для каждого проекта:**

#### **docker-compose.yml для проекта 2:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: ecommerce_postgres
    environment:
      POSTGRES_DB: ecommerce_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5434:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 📊 **Мониторинг множественных баз данных**

### **Команды для проверки всех баз данных:**

```bash
# Проверка всех PostgreSQL контейнеров
docker ps | grep postgres

# Подключение к разным базам данных
psql -h localhost -p 5433 -U postgres -d gongbu_dev
psql -h localhost -p 5434 -U postgres -d ecommerce_db
psql -h localhost -p 5435 -U postgres -d blog_db
```

### **MCP команды для мониторинга:**

```
@mcp Покажи все таблицы в базе данных gongbu_dev
@mcp Покажи все таблицы в базе данных ecommerce_db
@mcp Покажи все таблицы в базе данных blog_db
@mcp Покажи статистику по всем базам данных
```

---

## 🎯 **Лучшие практики**

### **1. Именование серверов**
- Используйте описательные имена: `postgres-gongbu`, `postgres-ecommerce`
- Включайте название проекта в имя сервера

### **2. Управление портами**
- Каждый проект на отдельном порту: 5433, 5434, 5435, etc.
- Документируйте порты в README каждого проекта

### **3. Переменные окружения**
```bash
# Создайте .env файлы для каждого проекта
# gongbu_app/.env
POSTGRES_URL=postgresql://postgres:postgres@localhost:5433/gongbu_dev

# ecommerce/.env
POSTGRES_URL=postgresql://postgres:password@localhost:5434/ecommerce_db
```

### **4. Резервное копирование**
```bash
# Бэкап для каждого проекта
pg_dump -h localhost -p 5433 -U postgres gongbu_dev > gongbu_backup.sql
pg_dump -h localhost -p 5434 -U postgres ecommerce_db > ecommerce_backup.sql
```

---

## 🚀 **Быстрый старт для нового проекта**

### **5-минутная настройка:**

```bash
# 1. Создаем проект
mkdir new_project && cd new_project

# 2. Запускаем PostgreSQL
docker run --name new_project_postgres -e POSTGRES_DB=new_project_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5436:5432 -d postgres:15-alpine

# 3. Обновляем ~/.cursor/mcp.json
# Добавляем конфигурацию для нового проекта

# 4. Перезапускаем Cursor

# 5. Тестируем
# В Cursor: @mcp Покажи все таблицы в базе данных new_project_db
```

---

## 🎉 **Итоги**

### ✅ **MCP PostgreSQL Server можно использовать в любых проектах:**

1. **Глобальная установка** - уже готова
2. **Множественные конфигурации** - поддерживается
3. **Отдельные базы данных** - для каждого проекта
4. **Единый интерфейс** - через Cursor AI
5. **Масштабируемость** - неограниченное количество проектов

### 🚀 **Преимущества:**

- **Переиспользование** одного MCP сервера
- **Единообразие** команд во всех проектах
- **Простота настройки** новых проектов
- **Централизованное управление** через Cursor
- **Экономия ресурсов** - один сервер для всех проектов

### 📈 **Ожидаемые результаты:**

- **Ускорение разработки** на 50-70%
- **Стандартизация** работы с БД
- **Упрощение** onboarding новых проектов
- **Лучшая интеграция** с AI-инструментами

**MCP PostgreSQL Server - ваш универсальный инструмент для работы с базами данных в любых проектах! 🐘🚀**

---

*Руководство создано на основе анализа текущей настройки MCP PostgreSQL Server в проекте Gongbu Platform*
