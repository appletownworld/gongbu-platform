# 🤝 Contributing to Gongbu Platform

Спасибо за интерес к развитию образовательной платформы Gongbu! Мы приветствуем вклад от разработчиков всех уровней.

## 🚀 Быстрый старт

### Настройка среды разработки

```bash
# Клонирование репозитория
git clone https://github.com/your-username/gongbu-platform.git
cd gongbu-platform

# Установка зависимостей
npm install

# Запуск инфраструктуры
docker-compose -f docker-compose.dev.yml up -d postgres redis elasticsearch

# Запуск сервисов в режиме разработки
npm run dev
```

### Архитектура проекта

```
gongbu-platform/
├── apps/
│   └── web-app/              # React веб-приложение
├── services/
│   ├── auth-service/        # Микросервис аутентификации
│   ├── course-service/      # Микросервис курсов
│   ├── bot-service/        # Telegram бот
│   ├── payment-service/    # Платежная система
│   └── notification-service/ # Уведомления
├── infrastructure/          # Docker, Nginx, мониторинг
└── docs/                   # Документация
```

## 📋 Процесс контрибуции

### 1. Создание Issue

Перед началом работы:
- 🔍 Проверьте существующие Issues
- 📝 Создайте новый Issue с описанием проблемы или функции
- 🏷️ Добавьте соответствующие лейблы

### 2. Разработка

```bash
# Создайте ветку для новой функции
git checkout -b feature/amazing-new-feature

# Или для исправления бага
git checkout -b fix/critical-bug-fix

# Внесите изменения
# ...

# Добавьте тесты для новой функциональности
npm test

# Проверьте качество кода
npm run lint
npm run type-check
```

### 3. Коммиты

Используйте конвенциональные коммиты:

```bash
# Примеры хороших коммитов
git commit -m "feat(auth): add Telegram WebApp authentication"
git commit -m "fix(courses): resolve course enrollment bug"
git commit -m "docs: update deployment instructions"
git commit -m "test: add integration tests for payment service"
```

**Типы коммитов:**
- `feat:` - новая функция
- `fix:` - исправление бага  
- `docs:` - изменения в документации
- `style:` - форматирование кода
- `refactor:` - рефакторинг
- `test:` - добавление тестов
- `chore:` - технические изменения

### 4. Pull Request

```bash
# Отправьте изменения в ваш fork
git push origin feature/amazing-new-feature

# Создайте Pull Request через GitHub UI
```

**Требования к PR:**
- ✅ Понятное описание изменений
- ✅ Связь с соответствующим Issue
- ✅ Прохождение всех тестов CI/CD
- ✅ Обновленная документация (если необходимо)

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты
npm test

# Тесты конкретного сервиса
cd services/auth-service && npm test

# Интеграционные тесты
npm run test:integration

# Покрытие кода
npm run test:coverage
```

### Типы тестов

- **Unit тесты** - отдельные функции и компоненты
- **Integration тесты** - взаимодействие между сервисами
- **E2E тесты** - полные пользовательские сценарии

## 📏 Стандарты кода

### TypeScript

```typescript
// ✅ Хорошо
interface UserCreateRequest {
  firstName: string;
  lastName: string;
  telegramId: number;
}

const createUser = async (data: UserCreateRequest): Promise<User> => {
  // implementation
};

// ❌ Плохо
const createUser = async (data: any) => {
  // implementation
};
```

### React компоненты

```tsx
// ✅ Хорошо
interface CourseCardProps {
  course: Course;
  onEnroll: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll }) => {
  return (
    <div className="card">
      <h3>{course.title}</h3>
      <button onClick={() => onEnroll(course.id)}>
        Записаться
      </button>
    </div>
  );
};
```

### API эндпоинты

```typescript
// ✅ Хорошо
@Controller('courses')
export class CoursesController {
  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, type: [CourseResponseDto] })
  async getAllCourses(
    @Query() query: CourseQueryDto
  ): Promise<CourseResponseDto[]> {
    return this.coursesService.findAll(query);
  }
}
```

## 🔒 Безопасность

### Правила безопасности

- 🚫 Никогда не коммитьте секреты, пароли или API ключи
- ✅ Используйте переменные окружения для конфигурации
- ✅ Валидируйте все входные данные
- ✅ Используйте HTTPS для всех API вызовов
- ✅ Следуйте принципу наименьших привилегий

### Аудит зависимостей

```bash
# Проверка уязвимостей
npm audit

# Автоматическое исправление
npm audit fix
```

## 📚 Документация

### API документация

- Используйте Swagger/OpenAPI для документирования API
- Добавляйте примеры запросов и ответов
- Описывайте все параметры и возможные ошибки

### Код документация

```typescript
/**
 * Создает новый курс в системе
 * @param courseData - данные для создания курса
 * @param creatorId - ID создателя курса
 * @returns созданный курс с присвоенным ID
 * @throws CourseValidationError если данные некорректны
 */
async createCourse(courseData: CreateCourseDto, creatorId: string): Promise<Course>
```

## 🐛 Отладка

### Полезные команды

```bash
# Логи всех сервисов
docker-compose -f docker-compose.dev.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.dev.yml logs -f auth-service

# Подключение к базе данных
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d gongbu_dev

# Подключение к Redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli
```

## 🎯 Roadmap

### Приоритетные задачи

- [ ] Система уведомлений
- [ ] Мобильное приложение  
- [ ] Видео-стриминг
- [ ] AI-рекомендации курсов
- [ ] Мультиязычность
- [ ] Advanced аналитика

### Как внести вклад

1. **Выберите задачу** из Issues с лейблом `good first issue`
2. **Обсудите решение** в комментариях к Issue
3. **Создайте PR** следуя гайдлайнам выше

## 🏷️ Лейблы Issues

- `bug` - Ошибки в коде
- `enhancement` - Новые функции  
- `documentation` - Улучшение документации
- `good first issue` - Подходит для новичков
- `help wanted` - Нужна помощь сообщества
- `priority: high` - Высокий приоритет
- `service: auth` - Относится к auth-service
- `service: courses` - Относится к course-service
- `service: bot` - Относится к bot-service

## 💬 Сообщество

- 💬 **Telegram**: [@gongbu_dev](https://t.me/gongbu_dev)
- 🐦 **Twitter**: [@gongbu_platform](https://twitter.com/gongbu_platform)
- 📧 **Email**: dev@gongbu.app

## ❓ FAQ

**Q: Как настроить Telegram бота для разработки?**
A: Создайте бота у @BotFather, получите токен и добавьте в .env файл

**Q: Нужен ли Docker для разработки?**
A: Да, для запуска PostgreSQL, Redis и Elasticsearch

**Q: Как запустить только фронтенд?**
A: `cd apps/web-app && npm run dev`

**Q: Где найти API документацию?**
A: После запуска сервисов: `http://localhost:3001/api/docs`

---

Спасибо за вклад в развитие платформы Gongbu! 🎓✨
