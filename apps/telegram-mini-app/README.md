# 📱 Gongbu Telegram Mini App

Telegram Mini App для образовательной платформы Gongbu - упрощенный интерфейс для просмотра и прохождения курсов прямо в Telegram.

## 🚀 Возможности

### 📚 Управление курсами
- **Просмотр курсов** - список всех доступных курсов
- **Прохождение уроков** - пошаговое изучение материала
- **Отслеживание прогресса** - визуальный индикатор завершения
- **Создание курсов** - базовый редактор для преподавателей

### 🌍 Многоязычность
- **3 языка**: Английский, Корейский, Русский
- **Автоопределение** языка из настроек Telegram
- **Мгновенная смена** языка в приложении
- **Сохранение настроек** между сессиями

### 🎨 Telegram интеграция
- **Нативная тема** - адаптация под светлую/темную тему Telegram
- **Haptic feedback** - тактильная обратная связь
- **Telegram уведомления** - алерты и подтверждения
- **WebApp API** - полная интеграция с Telegram

## 📁 Структура проекта

```
src/
├── components/           # React компоненты
│   ├── CourseEditor.tsx     # Редактор курсов
│   ├── CourseViewer.tsx     # Просмотр курсов
│   ├── LoginScreen.tsx      # Экран входа
│   ├── LoadingScreen.tsx    # Экран загрузки
│   ├── ErrorBoundary.tsx    # Обработка ошибок
│   ├── SettingsScreen.tsx   # Экран настроек
│   └── LanguageSelector.tsx # Селектор языка
├── hooks/               # React хуки
│   ├── useAuth.ts          # Аутентификация
│   ├── useCourses.ts       # Управление курсами
│   ├── useI18n.ts          # Интернационализация
│   └── useTelegramWebApp.ts # Telegram WebApp
├── App.tsx              # Главный компонент
└── App.css              # Стили
```

## 🛠️ Технологии

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Telegram WebApp API** - интеграция с Telegram
- **CSS Variables** - адаптивные темы
- **localStorage** - локальное хранение данных

## 🚀 Запуск

### Development
```bash
cd apps/telegram-mini-app
npm install
npm start
```

### Production
```bash
npm run build
```

## 📱 Использование в Telegram

### 1. Создание бота
1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Настройте Web App URL

### 2. Настройка Web App
```javascript
// В настройках бота через BotFather
/setmenubutton
@your_bot_name
Gongbu Learning
https://your-domain.com/telegram-mini-app
```

### 3. Тестирование
1. Откройте бота в Telegram
2. Нажмите на кнопку меню
3. Выберите "Gongbu Learning"
4. Mini App откроется в Telegram

## 🎯 Основные экраны

### 🔐 Экран входа
- Авторизация через Telegram
- Автоматическое получение данных пользователя
- Красивый welcome интерфейс

### 📚 Главный экран
- Список курсов пользователя
- Компактный селектор языка
- Кнопка настроек
- Создание нового курса

### 📖 Просмотр курса
- Навигация по урокам
- Отметка о завершении
- Прогресс-бар
- Кнопки "Назад/Далее"

### ⚙️ Настройки
- Выбор языка
- Информация о приложении
- Данные Telegram WebApp

## 🌍 Система языков

### Поддерживаемые языки
- **🇺🇸 English** - международный
- **🇰🇷 한국어** - корейский
- **🇷🇺 Русский** - русский

### Автоопределение
1. Сохраненные настройки пользователя
2. Язык Telegram пользователя
3. Язык браузера
4. Английский (по умолчанию)

### Смена языка
```typescript
const { t, setLanguage } = useI18n();

// Смена на корейский
setLanguage('ko');

// Перевод текста
const title = t('course.title'); // "Course" / "강의" / "Курс"
```

## 🎨 Темы и стили

### Telegram темы
```css
/* Автоматическая адаптация под тему Telegram */
background-color: var(--tg-theme-bg-color);
color: var(--tg-theme-text-color);
border-color: var(--tg-theme-hint-color);
```

### Адаптивный дизайн
- Мобильный-first подход
- Touch-friendly интерфейс
- Оптимизация для маленьких экранов
- Плавные анимации

## 🔧 API интеграция

### Telegram WebApp
```typescript
// Инициализация
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

// Haptic feedback
window.Telegram.WebApp.HapticFeedback.impactOccurred('light');

// Показать алерт
window.Telegram.WebApp.showAlert('Message');

// Получить данные пользователя
const user = window.Telegram.WebApp.initDataUnsafe.user;
```

### Аутентификация
```typescript
const { user, login } = useAuth();

// Вход через Telegram
await login(window.Telegram.WebApp.initData);

// Данные пользователя
console.log(user.first_name, user.language_code);
```

## 📊 Управление курсами

### Создание курса
```typescript
const { createCourse } = useCourses();

const newCourse = await createCourse({
  title: 'My Course',
  description: 'Course description',
  difficulty: 'beginner'
});
```

### Обновление курса
```typescript
const { updateCourse } = useCourses();

await updateCourse(courseId, {
  title: 'Updated Title',
  completionRate: 85
});
```

## 🚀 Развертывание

### 1. Сборка
```bash
npm run build
```

### 2. Загрузка на сервер
```bash
# Загрузите build/ на ваш веб-сервер
# Убедитесь, что доступен по HTTPS
```

### 3. Настройка бота
```bash
# Установите Web App URL в BotFather
/setmenubutton
@your_bot_name
Gongbu Learning
https://your-domain.com/telegram-mini-app
```

## 🐛 Отладка

### Development режим
```typescript
// Mock данные для разработки
const mockWebApp = {
  initDataUnsafe: {
    user: {
      id: 123456789,
      first_name: 'Test',
      language_code: 'en'
    }
  }
};
```

### Логирование
```typescript
// Включите логи в консоли браузера
console.log('Telegram WebApp:', window.Telegram?.WebApp);
console.log('User data:', user);
```

## 📱 Тестирование

### В Telegram
1. Откройте бота
2. Нажмите кнопку меню
3. Выберите Mini App
4. Протестируйте все функции

### В браузере
1. Откройте `http://localhost:3000`
2. Используйте mock данные
3. Тестируйте без Telegram

## 🔒 Безопасность

### Валидация данных
- Проверка initData от Telegram
- Валидация пользовательского ввода
- Санитизация данных

### HTTPS
- Обязательно используйте HTTPS
- Telegram требует безопасное соединение
- SSL сертификат обязателен

## 📈 Производительность

### Оптимизации
- Lazy loading компонентов
- Минимальные re-renders
- Эффективное состояние
- Оптимизированные изображения

### Кеширование
- localStorage для данных
- Кеш переводов
- Сохранение настроек

## 🆘 Поддержка

### Проблемы
- Проверьте консоль браузера
- Убедитесь в HTTPS соединении
- Проверьте настройки бота

### Контакты
- 📧 Email: support@gongbu.app
- 💬 Telegram: @gongbu_support
- 🌐 Website: https://gongbu.app

---

**Gongbu Telegram Mini App** - Обучение прямо в Telegram! 📚🚀
