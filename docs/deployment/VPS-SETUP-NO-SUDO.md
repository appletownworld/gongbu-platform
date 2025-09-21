# 🚀 Настройка VPS для GitHub Actions деплоя (БЕЗ SUDO)

## 🎯 Важно: исправлена проблема с sudo!

**Предыдущая версия** требовала `sudo` доступ, что вызывало ошибки в GitHub Actions.  
**Новая версия** работает в домашней директории пользователя без sudo.

## 📋 Минимальная настройка VPS

### 1. Создание пользователя для деплоя

```bash
# На VPS (под root или sudo пользователем)
adduser deploy
usermod -aG docker deploy

# Настройка SSH ключей
mkdir -p /home/deploy/.ssh
# Скопируйте ваш публичный SSH ключ
nano /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 2. Установка необходимых пакетов

```bash
# Обновление системы
apt update && apt upgrade -y

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Git
apt install git -y
```

### 3. Проверка настройки Docker

```bash
# Переключитесь на пользователя deploy
su - deploy

# Проверьте права доступа к Docker
docker --version
docker-compose --version
docker ps

# Если есть ошибки с правами:
# exit (выйти из deploy)
# usermod -aG docker deploy
# su - deploy  (снова зайти)
```

## 🔑 Настройка SSH ключей

### Создание SSH ключа (на вашей машине):

```bash
# Генерация ключа
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/gongbu_deploy

# Просмотр публичного ключа (добавить в authorized_keys)
cat ~/.ssh/gongbu_deploy.pub

# Просмотр приватного ключа (добавить в GitHub Secrets как VPS_SSH_KEY)
cat ~/.ssh/gongbu_deploy
```

### Тест подключения:

```bash
# Тест SSH подключения
ssh -i ~/.ssh/gongbu_deploy deploy@YOUR_VPS_IP

# На VPS должны работать команды без sudo:
docker ps
git --version
```

## 🛠️ GitHub Secrets

**Обновленные секреты для нового подхода:**

```
Name: VPS_HOST
Value: YOUR_VPS_IP

Name: VPS_USER
Value: deploy

Name: VPS_SSH_KEY
Value: [ПРИВАТНЫЙ SSH КЛЮЧ - содержимое ~/.ssh/gongbu_deploy]
```

**Остальные секреты остаются такими же как в `SETUP-GITHUB-SECRETS.md`**

## 🗂️ Структура файлов на VPS

После деплоя файлы будут находиться в:
```
/home/deploy/gongbu-platform/
├── .env                          # Создается автоматически
├── docker-compose.prod.yml       # Продакшн конфигурация
├── apps/
├── services/
└── ...
```

## 🌐 Настройка Nginx (опционально)

Если вы хотите использовать Nginx как reverse proxy:

```bash
# Установка Nginx
apt install nginx -y

# Конфигурация для проксирования к Docker контейнерам
nano /etc/nginx/sites-available/gongbu-platform

# Пример конфигурации:
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Активация конфигурации
ln -s /etc/nginx/sites-available/gongbu-platform /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 🔍 Troubleshooting

### Проблема: "permission denied" для Docker

```bash
# Решение: добавить пользователя в группу docker
sudo usermod -aG docker deploy
# Перелогиниться:
exit
ssh -i ~/.ssh/gongbu_deploy deploy@YOUR_VPS_IP
# Проверить:
docker ps
```

### Проблема: SSH ключ не работает

```bash
# На VPS проверить права:
ls -la /home/deploy/.ssh/
# Должно быть:
# drwx------  2 deploy deploy  4096 authorized_keys
# -rw-------  1 deploy deploy   xxx authorized_keys

# Исправление прав:
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### Проблема: Docker Compose не найден

```bash
# Проверка установки:
docker-compose --version

# Если не найден, переустановка:
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## ✅ Проверка готовности

**Убедитесь что все работает ПЕРЕД запуском GitHub Actions:**

```bash
# SSH подключение работает без пароля:
ssh -i ~/.ssh/gongbu_deploy deploy@YOUR_VPS_IP

# На VPS все команды работают:
docker --version       # ✅ Должен показать версию
docker ps              # ✅ Должен показать контейнеры (может быть пустой список)
docker-compose --version  # ✅ Должен показать версию
git --version          # ✅ Должен показать версию
whoami                 # ✅ Должен показать "deploy"
```

## 🚀 Запуск деплоя

После настройки VPS:

1. **Добавьте секреты** в GitHub согласно `SETUP-GITHUB-SECRETS.md`
2. **Запустите деплой** через GitHub Actions
3. **Или сделайте git push** для автоматического запуска

**Теперь деплой будет работать без ошибок sudo!** 🎉

---

## 📞 Поддержка

При проблемах с настройкой:
- Проверьте все команды из раздела "Проверка готовности"
- Убедитесь что пользователь `deploy` может запускать `docker` команды без sudo
- Проверьте что SSH подключение работает без пароля
