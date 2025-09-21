# 🔧 Настройка MCP GitHub Server в Cursor.ai

## 📋 Пошаговая инструкция

### 🎯 Шаг 1: Подготовка MCP серверов

Мы уже установили и протестировали MCP GitHub Server. Убедитесь, что серверы доступны:

```bash
# Проверка доступности github-mcp-server
npx github-mcp-server --help

# Проверка Node.js и npm
node --version  # v22.19.0
npm --version   # v10.9.3
```

### 🔧 Шаг 2: Настройка через файл конфигурации

#### Вариант А: Редактирование ~/.cursor/mcp.json

```json
{
  "mcpServers": {
    "github-mcp-server": {
      "command": "npx",
      "args": ["-y", "github-mcp-server"],
      "env": {},
      "cwd": "/home/zebracoder/projects/gongbu_app"
    },
    "unified-github-mcp": {
      "command": "npx", 
      "args": ["-y", "unified-github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here"
      },
      "cwd": "/home/zebracoder/projects/gongbu_app"
    }
  }
}
```

### 🖥️ Шаг 3: Настройка через UI Cursor

1. **Откройте Cursor** и перейдите в настройки
2. **Settings** → **Features** → **Model Context Protocol** 
3. **Добавить новый MCP Server:**
   - **Name:** `github-mcp-server`
   - **Command:** `npx`
   - **Args:** `-y github-mcp-server`
   - **Working Directory:** `/home/zebracoder/projects/gongbu_app`

### 🔐 Шаг 4: Настройка GitHub токена (опционально)

Для расширенных возможностей GitHub API создайте Personal Access Token:

1. **GitHub** → **Settings** → **Developer settings** → **Personal access tokens**
2. **Generate new token** с правами:
   - `repo` - доступ к репозиториям
   - `read:user` - информация о пользователе  
   - `workflow` - управление GitHub Actions
3. **Добавьте токен в переменную окружения:**
   ```bash
   export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"
   ```

---

## 🚀 Использование MCP в Cursor

### 💬 Базовые команды через AI Chat

После настройки MCP можете использовать следующие команды в чате Cursor:

#### 📊 **Git операции:**
```
@mcp Покажи текущий статус репозитория
@mcp Создай коммит с сообщением "feat: добавлена новая функция"  
@mcp Отправь изменения на GitHub
@mcp Покажи последние 5 коммитов
@mcp Создай новую ветку feature/authentication
```

#### 🔄 **Workflow команды:**
```
@mcp Выполни полный workflow: добавь файлы → коммит → push
@mcp Синхронизируй с удаленным репозиторием (pull + push)
@mcp Слей текущую ветку в main
@mcp Создай backup текущего состояния
```

#### 📁 **Информационные команды:**
```
@mcp Покажи все ветки в репозитории
@mcp Покажи различия в файлах
@mcp Покажи список удаленных репозиториев
@mcp Покажи статистику коммитов
```

### 🎯 **Продвинутые возможности:**

#### 🔧 **GitHub API операции** (требует токен):
```
@mcp Создай новую Issue "Добавить аутентификацию"
@mcp Покажи все открытые Pull Request'ы
@mcp Получи содержимое файла package.json из GitHub
@mcp Запусти GitHub Action workflow для деплоя
```

#### 🤖 **AI-assisted Git:**
```
@mcp Проанализируй изменения в последнем коммите и объясни что изменилось
@mcp Предложи хорошее сообщение коммита для текущих изменений  
@mcp Проверь есть ли конфликты при слиянии с main
@mcp Создай PR с автоматическим описанием изменений
```

---

## 📚 Примеры реальных сценариев

### 🔄 **Сценарий 1: Ежедневная разработка**
```
Разработчик: "Я внес изменения в код, помоги мне отправить их на GitHub"

AI с MCP:
1. @mcp git-status - проверю что изменилось
2. @mcp git-add-all - добавлю все файлы
3. @mcp git-commit "feat: implement user authentication" - создам коммит
4. @mcp git-push - отправлю на GitHub

Готово! Изменения отправлены в репозиторий.
```

### 🐛 **Сценарий 2: Исправление бага**
```
Разработчик: "Нужно быстро исправить критический баг в продакшене"

AI с MCP:
1. @mcp git-branch hotfix/critical-bug - создаю hotfix ветку
2. [разработчик исправляет код]
3. @mcp git-flow "hotfix: fix critical authentication bug" - быстрый workflow
4. @mcp git-checkout main && git-merge hotfix/critical-bug - возвращаюсь в main и сливаю

Hotfix развернут!
```

### 📊 **Сценарий 3: Анализ проекта** 
```
Разработчик: "Покажи мне состояние проекта"

AI с MCP:
1. @mcp git-status - текущие изменения
2. @mcp git-log 10 - последние коммиты  
3. @mcp git-branch - все ветки
4. @mcp git-remote-list - настройка удаленных репозиториев

Полная картина проекта готова!
```

---

## ⚙️ Продвинутые настройки

### 📝 **Кастомизация команд**
Создайте файл `.cursor/mcp_aliases.json` для собственных алиасов:

```json
{
  "aliases": {
    "deploy": "@mcp git-flow 'deploy: release version' && trigger_workflow deploy",
    "hotfix": "@mcp git-branch hotfix/$1 && git-checkout hotfix/$1", 
    "review": "@mcp git-log 5 && git-diff HEAD~1",
    "backup": "@mcp git-stash 'backup-$(date)' && git-push"
  }
}
```

### 🔍 **Отладка MCP**
Если MCP не работает:

```bash
# Проверить логи Cursor
tail -f ~/.cursor/logs/main.log

# Протестировать MCP сервер напрямую
npx github-mcp-server git-status

# Проверить конфигурацию
cat ~/.cursor/mcp.json
```

---

## ✅ Проверка работоспособности

После настройки протестируйте MCP:

1. **Откройте Cursor**
2. **Начните новый чат** 
3. **Введите команду:** `@mcp Покажи статус репозитория`
4. **Должен появиться ответ** с текущим состоянием Git репозитория

Если команда сработала - MCP GitHub Server успешно интегрирован! 🎉

---

## 🆘 Решение проблем

| Проблема | Решение |
|----------|---------|
| MCP server не найден | Убедитесь что `npx github-mcp-server` работает в терминале |
| Нет прав доступа | Добавьте GitHub Personal Access Token в переменные окружения |
| Команды не выполняются | Проверьте `cwd` путь в конфигурации MCP |
| Cursor не видит MCP | Перезапустите Cursor после изменения конфигурации |

---

## 🎯 Итоги

**MCP GitHub Server в Cursor даёт возможность:**
- ⚡ **30+ Git операций** через AI команды
- 🤖 **Автоматизация** рутинных Git задач  
- 📊 **Анализ репозитория** с помощью ИИ
- 🔄 **Workflow комбинации** одной командой
- 🐙 **GitHub API интеграция** для управления Issues/PR

**Cursor + MCP = мощный инструмент для разработки! 🚀**
