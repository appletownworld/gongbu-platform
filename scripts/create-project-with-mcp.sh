#!/bin/bash

# 🚀 Скрипт для создания нового проекта с MCP PostgreSQL Server
# Использование: ./create-project-with-mcp.sh project_name database_name port

set -e

# Проверяем аргументы
if [ $# -ne 3 ]; then
    echo "❌ Использование: $0 <project_name> <database_name> <port>"
    echo "📝 Пример: $0 ecommerce ecommerce_db 5434"
    exit 1
fi

PROJECT_NAME=$1
DATABASE_NAME=$2
PORT=$3
PROJECT_PATH="/home/zebracoder/projects/$PROJECT_NAME"
POSTGRES_PASSWORD="password"

echo "🚀 Создание проекта: $PROJECT_NAME"
echo "📊 База данных: $DATABASE_NAME"
echo "🔌 Порт: $PORT"
echo "📁 Путь: $PROJECT_PATH"

# Создаем директорию проекта
echo "📁 Создаем директорию проекта..."
mkdir -p "$PROJECT_PATH"
cd "$PROJECT_PATH"

# Инициализируем npm проект
echo "📦 Инициализируем npm проект..."
npm init -y

# Создаем базовую структуру
echo "🏗️ Создаем базовую структуру..."
mkdir -p src/{controllers,models,routes,services}
mkdir -p config
mkdir -p docs

# Создаем .env файл
echo "⚙️ Создаем .env файл..."
cat > .env << EOF
# Database Configuration
POSTGRES_URL=postgresql://postgres:$POSTGRES_PASSWORD@localhost:$PORT/$DATABASE_NAME
POSTGRES_HOST=localhost
POSTGRES_PORT=$PORT
POSTGRES_DB=$DATABASE_NAME
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Application Configuration
NODE_ENV=development
PORT=3000
EOF

# Создаем docker-compose.yml
echo "🐳 Создаем docker-compose.yml..."
cat > docker-compose.yml << EOF
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: ${PROJECT_NAME}_postgres
    environment:
      POSTGRES_DB: $DATABASE_NAME
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: $POSTGRES_PASSWORD
    ports:
      - "$PORT:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF

# Создаем README.md
echo "📚 Создаем README.md..."
cat > README.md << EOF
# $PROJECT_NAME

## 🚀 Быстрый старт

### 1. Запуск базы данных
\`\`\`bash
docker-compose up -d postgres
\`\`\`

### 2. Установка зависимостей
\`\`\`bash
npm install
\`\`\`

### 3. Настройка MCP PostgreSQL Server

Добавьте в \`~/.cursor/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "postgres-$PROJECT_NAME": {
      "command": "npx",
      "args": ["@monsoft/mcp-postgres", "--connection-string", "postgresql://postgres:$POSTGRES_PASSWORD@localhost:$PORT/$DATABASE_NAME"],
      "cwd": "$PROJECT_PATH"
    }
  }
}
\`\`\`

### 4. Использование MCP в Cursor

\`\`\`
@mcp Покажи все таблицы в базе данных $DATABASE_NAME
@mcp Создай таблицу users с полями id, email, created_at
@mcp Выполни запрос: SELECT * FROM users LIMIT 10
\`\`\`

## 📊 Информация о проекте

- **База данных:** $DATABASE_NAME
- **Порт PostgreSQL:** $PORT
- **Путь проекта:** $PROJECT_PATH
- **MCP Server:** postgres-$PROJECT_NAME

## 🛠️ Команды

\`\`\`bash
# Запуск базы данных
docker-compose up -d postgres

# Остановка базы данных
docker-compose down

# Подключение к базе данных
psql -h localhost -p $PORT -U postgres -d $DATABASE_NAME

# Бэкап базы данных
pg_dump -h localhost -p $PORT -U postgres $DATABASE_NAME > backup.sql
\`\`\`
EOF

# Создаем .gitignore
echo "📝 Создаем .gitignore..."
cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF

# Запускаем PostgreSQL контейнер
echo "🐳 Запускаем PostgreSQL контейнер..."
docker-compose up -d postgres

# Ждем запуска базы данных
echo "⏳ Ждем запуска базы данных..."
sleep 10

# Проверяем подключение
echo "🔍 Проверяем подключение к базе данных..."
if docker exec ${PROJECT_NAME}_postgres pg_isready -U postgres; then
    echo "✅ База данных запущена успешно!"
else
    echo "❌ Ошибка запуска базы данных"
    exit 1
fi

# Создаем MCP конфигурацию
echo "⚙️ Создаем MCP конфигурацию..."
MCP_CONFIG="{
  \"mcpServers\": {
    \"postgres-$PROJECT_NAME\": {
      \"command\": \"npx\",
      \"args\": [\"@monsoft/mcp-postgres\", \"--connection-string\", \"postgresql://postgres:$POSTGRES_PASSWORD@localhost:$PORT/$DATABASE_NAME\"],
      \"cwd\": \"$PROJECT_PATH\"
    }
  }
}"

echo "📋 Добавьте следующую конфигурацию в ~/.cursor/mcp.json:"
echo ""
echo "$MCP_CONFIG"
echo ""

# Создаем файл с конфигурацией MCP
echo "$MCP_CONFIG" > mcp-config.json

echo "🎉 Проект $PROJECT_NAME создан успешно!"
echo ""
echo "📁 Расположение: $PROJECT_PATH"
echo "🐳 PostgreSQL: localhost:$PORT"
echo "📊 База данных: $DATABASE_NAME"
echo "⚙️ MCP конфигурация: mcp-config.json"
echo ""
echo "🚀 Следующие шаги:"
echo "1. Добавьте конфигурацию MCP в ~/.cursor/mcp.json"
echo "2. Перезапустите Cursor"
echo "3. Протестируйте: @mcp Покажи все таблицы в базе данных $DATABASE_NAME"
echo ""
echo "📚 Документация: README.md"
