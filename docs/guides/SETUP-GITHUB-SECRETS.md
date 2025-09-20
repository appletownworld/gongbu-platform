# 🔒 Настройка GitHub Secrets для Gongbu Platform

## 🛡️ О безопасности GitHub Secrets

**GitHub Secrets - это безопасное хранилище:**
- ✅ **Зашифровано** - все секреты хранятся в зашифрованном виде
- ✅ **Ограниченный доступ** - только владельцы репозитория могут их видеть
- ✅ **Не видны в логах** - автоматически скрываются в логах Actions
- ✅ **Используются только в Actions** - недоступны извне
- ✅ **Audit trail** - GitHub логирует все изменения секретов

**⚠️ КРИТИЧЕСКИЕ ПРАВИЛА БЕЗОПАСНОСТИ:**
1. **НИКОГДА** не копируйте примеры паролей из инструкции
2. **ОБЯЗАТЕЛЬНО** генерируйте уникальные пароли для вашего проекта
3. **НИКОГДА** не пушьте секреты в код (используйте .env и .gitignore)
4. **РЕГУЛЯРНО** меняйте пароли (рекомендуется каждые 90 дней)
5. **ОГРАНИЧИВАЙТЕ** права доступа к репозиторию

## 🎯 Что делать СЕЙЧАС

Ваш репозиторий: **https://github.com/appletownworld/gongbu-platform**

### 📋 Шаг 1: Перейти в настройки репозитория

1. Откройте ваш репозиторий: https://github.com/appletownworld/gongbu-platform
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**

### 📋 Шаг 2: Добавить обязательные секреты

**Скопируйте и добавьте каждый секрет по очереди:**

#### 🖥️ VPS Подключение

⚠️ **ВАЖНО:** Если ваш деплой упал с ошибкой `sudo: a password is required`, изучите инструкцию: **[VPS-SETUP-NO-SUDO.md](./VPS-SETUP-NO-SUDO.md)**

```
Name: VPS_HOST
Value: YOUR_VPS_IP_ADDRESS (например: 123.45.67.89)

Name: VPS_USER  
Value: deploy (рекомендуется) или ubuntu

Name: VPS_SSH_KEY
Value: YOUR_PRIVATE_SSH_KEY (полный приватный SSH ключ)
```

**🔧 Требования к VPS пользователю:**
- ✅ Пользователь должен быть в группе `docker`
- ✅ SSH подключение должно работать без пароля (по ключу)
- ❌ **НЕ требуется** sudo доступ (деплой работает в `~/gongbu-platform`)

#### 🌐 Домен и URL
```
Name: DOMAIN_NAME
Value: your-domain.com

Name: TELEGRAM_BOT_USERNAME
Value: @your_bot_username

Name: API_BASE_URL
Value: https://your-domain.com/api

Name: WEBHOOK_URL
Value: https://your-domain.com/webhook

Name: WEBSOCKET_URL
Value: wss://your-domain.com/ws

Name: APP_URL
Value: https://your-domain.com
```

#### 🔒 Безопасность и База данных

⚠️ **КРИТИЧЕСКИ ВАЖНО:** Генерируйте уникальные пароли для ВАШЕГО проекта!

**Генерация безопасных паролей:**
```bash
# Генерация паролей БД (сохраните результат!)
DB_PASSWORD=$(openssl rand -base64 32)
echo "DB_PASSWORD: $DB_PASSWORD"

# Генерация JWT секрета (64+ символа)
JWT_SECRET=$(openssl rand -base64 64)  
echo "JWT_SECRET: $JWT_SECRET"

# Генерация Redis пароля
REDIS_PASSWORD=$(openssl rand -base64 24)
echo "REDIS_PASSWORD: $REDIS_PASSWORD"
```

**Теперь используйте СВОИ сгенерированные пароли:**
```
Name: DATABASE_URL
Value: postgresql://gongbu_user:[ВАШ_DB_PASSWORD]@localhost:5432/gongbu_platform

Name: DB_USER
Value: gongbu_user

Name: DB_PASSWORD  
Value: [ВАШ_DB_PASSWORD]

Name: REDIS_PASSWORD
Value: [ВАШ_REDIS_PASSWORD]

Name: JWT_SECRET
Value: [ВАШ_JWT_SECRET]
```

#### 🤖 Telegram

⚠️ **Используйте РЕАЛЬНЫЕ токены из @BotFather:**
```bash
# Получите токен от @BotFather в Telegram
# Создайте бота: /newbot
# Скопируйте токен, который выглядит как: 1234567890:ABCd1234efgh5678...
```

**Добавьте ваши реальные данные:**
```
Name: TELEGRAM_BOT_TOKEN
Value: [ВАШ_ТОКЕН_ОТ_BOTFATHER]

Name: TELEGRAM_CHAT_ID  
Value: [ВАШ_CHAT_ID_ДЛЯ_УВЕДОМЛЕНИЙ]

Name: TELEGRAM_WEBAPP_SECRET
Value: [СГЕНЕРИРУЙТЕ_OPENSSL: openssl rand -hex 32]

Name: ADMIN_USER_IDS
Value: [ВАШ_TELEGRAM_USER_ID,ДРУГИЕ_АДМИНЫ]
```

#### 🌍 CORS
```
Name: CORS_ORIGIN
Value: https://your-domain.com,https://www.your-domain.com
```

#### 📊 Мониторинг
```
Name: GRAFANA_ADMIN_PASSWORD
Value: secure_grafana_password
```

### 🚀 Шаг 3: Автоматический деплой теперь ВКЛЮЧЕН!

✅ **Автодеплой настроен и активен!** После добавления секретов:

**Вариант 1: Автоматический деплой (рекомендуется)**
```bash
# Любые изменения в main ветке запустят деплой
git add .
git commit -m "🚀 Deploy to production"
git push origin main
# → Деплой запустится автоматически!
```

**Вариант 2: Ручной запуск**
1. **Перейдите в Actions** → **Deploy to VPS**
2. **Нажмите "Run workflow"** → **"Run workflow"**

### ⏱️ Что произойдет дальше

GitHub Actions автоматически:
- ✅ Клонирует код в `/var/www/gongbu-platform`
- ✅ Создаст `.env` файл из секретов GitHub
- ✅ Соберет все 8 микросервисов через `docker-compose.prod.yml`
- ✅ Запустит полную продакшн систему
- ✅ Дождется прохождения health checks
- ✅ Проверит доступность HTTPS endpoints
- ✅ Уведомит в Telegram о статусе деплоя

**Время деплоя: ~10-15 минут**

### 🎉 Результат

После успешного деплоя у вас будет:
- 🌐 **Веб-приложение**: https://your-domain.com
- 📊 **Мониторинг**: https://your-domain.com/grafana  
- 📖 **API документация**: https://your-domain.com/api/docs
- 🤖 **Telegram бот**: Готов к работе

### 🔍 Мониторинг деплоя

Следите за прогрессом в:
- **GitHub Actions**: https://github.com/appletownworld/gongbu-platform/actions
- **Логи деплоя**: Во вкладке Actions → Deploy workflow

### ❓ Если что-то пошло не так

1. Проверьте все секреты в GitHub Settings
2. Убедитесь, что VPS доступен по SSH
3. Проверьте логи в GitHub Actions
4. Посмотрите файл `VPS-DEPLOYMENT.md` для troubleshooting

---

## 🎯 БЫСТРЫЙ ЧЕКЛИСТ БЕЗОПАСНОСТИ

### 🔐 Перед добавлением секретов:
- [ ] **Сгенерировал уникальные пароли** (не копировал примеры!)
- [ ] **Получил реальный токен бота** от @BotFather
- [ ] **Записал пароли в безопасное место** (менеджер паролей)
- [ ] **Проверил права доступа** к репозиторию

### 🚀 Деплой:
- [ ] Добавил все обязательные секреты в GitHub
- [ ] VPS готов и доступен по SSH  
- [ ] Домен настроен (A-записи на IP VPS)
- [ ] Запустил GitHub Actions workflow
- [ ] Жду ~15 минут завершения деплоя
- [ ] Проверяю работу платформы по домену

### 🛡️ После деплоя:
- [ ] **Настроил firewall** на VPS (только порты 22, 80, 443)
- [ ] **Отключил SSH по паролю** (только по ключу)
- [ ] **Настроил автоматические обновления безопасности**
- [ ] **Настроил мониторинг логов** (fail2ban)
- [ ] **Настроил SSL сертификат** (Let's Encrypt)
- [ ] **Запланировал ротацию паролей** (каждые 90 дней)

## 🚨 Дополнительные меры безопасности

### 🔧 На VPS сервере:
```bash
# Настройка firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow http  
sudo ufw allow https

# Отключение SSH по паролю
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no
sudo systemctl restart ssh

# Автоматические обновления
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Мониторинг попыток взлома
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 📊 Мониторинг безопасности:
- **Логи входов:** `sudo tail -f /var/log/auth.log`
- **Логи Nginx:** `sudo tail -f /var/log/nginx/error.log`
- **Docker логи:** `docker-compose logs --tail=100`

### 🔄 Ротация секретов (каждые 90 дней):
1. Сгенерируйте новые пароли
2. Обновите GitHub Secrets
3. Перезапустите деплой
4. Обновите пароли в вашем менеджере паролей

**⚠️ ВАЖНО:** При компрометации любого секрета немедленно смените ВСЕ пароли!

---

**🚀 После соблюдения всех мер безопасности ваша платформа готова к безопасной коммерческой эксплуатации!**
