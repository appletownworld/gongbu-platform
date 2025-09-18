# 🔒 Настройка GitHub Secrets для Gongbu Platform

## 🎯 Что делать СЕЙЧАС

Ваш репозиторий: **https://github.com/appletownworld/gongbu-platform**

### 📋 Шаг 1: Перейти в настройки репозитория

1. Откройте ваш репозиторий: https://github.com/appletownworld/gongbu-platform
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**

### 📋 Шаг 2: Добавить обязательные секреты

**Скопируйте и добавьте каждый секрет по очереди:**

#### 🖥️ VPS Подключение
```
Name: VPS_HOST
Value: YOUR_VPS_IP_ADDRESS (например: 123.45.67.89)

Name: VPS_USER  
Value: ubuntu

Name: VPS_SSH_KEY
Value: YOUR_PRIVATE_SSH_KEY (полный приватный SSH ключ)
```

#### 🌐 Домен и URL
```
Name: DOMAIN_NAME
Value: your-domain.com

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
```
Name: DATABASE_URL
Value: postgresql://gongbu_user:super_secure_password@localhost:5432/gongbu_platform

Name: DB_USER
Value: gongbu_user

Name: DB_PASSWORD
Value: super_secure_password_123!

Name: REDIS_PASSWORD
Value: redis_password_456!

Name: JWT_SECRET
Value: your_64_character_jwt_secret_key_minimum_length_for_security!
```

#### 🤖 Telegram
```
Name: TELEGRAM_BOT_TOKEN
Value: 1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh

Name: TELEGRAM_CHAT_ID
Value: -1001234567890

Name: TELEGRAM_WEBAPP_SECRET
Value: your_webapp_secret_here

Name: ADMIN_USER_IDS
Value: 123456789,987654321
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

## 🎯 БЫСТРЫЙ ЧЕКЛИСТ

- [ ] Добавил все 12 обязательных секретов в GitHub
- [ ] VPS готов и доступен по SSH  
- [ ] Домен настроен (A-записи на IP VPS)
- [ ] Запустил GitHub Actions workflow
- [ ] Жду ~15 минут завершения деплоя
- [ ] Проверяю работу платформы по домену

**🚀 После этого ваша образовательная платформа будет полностью готова к использованию!**
