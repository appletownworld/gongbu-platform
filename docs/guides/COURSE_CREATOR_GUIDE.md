# 👨‍🏫 Руководство для экспертов-создателей курсов

**Дата:** 20 сентября 2025  
**Статус:** ✅ Полная функциональность для создателей курсов готова  

---

## 🎯 **Для кого это руководство**

Это руководство для **экспертов-учителей**, которые хотят:
- 📚 Создавать и публиковать образовательные курсы
- 💰 Монетизировать свои знания и экспертизу
- 👨‍🎓 Обучать студентов через Telegram Bot + Mini-App
- 📊 Управлять своими курсами и анализировать успехи

---

## 🚀 **Полная система для создателей курсов**

### **🔐 Роль CREATOR в системе**

В Gongbu Platform предусмотрена специальная роль `CREATOR` со следующими возможностями:

```sql
-- Роли пользователей
enum UserRole {
  STUDENT    -- Изучает курсы
  CREATOR    -- Создает курсы ⭐
  ADMIN      -- Администрирует платформу
}
```

**Создатель курса получает:**
- ✅ Доступ к созданию и управлению курсами
- ✅ Персональную панель управления
- ✅ Аналитику по своим курсам
- ✅ Возможность настройки цен и монетизации
- ✅ Интеграцию с Telegram Bot для каждого курса

---

## 📱 **Пользовательские интерфейсы**

### **🏠 Панель управления создателя**

**Файл:** `apps/web-app/src/pages/DashboardPage.tsx`

**Функциональность:**
- 📊 Статистика по всем курсам
- 🎯 Быстрые действия: "Создать курс", "Управление курсами"
- 📈 Аналитика активности студентов
- 🏆 Система достижений

**Ключевые компоненты:**
```tsx
// Быстрые действия для создателей
<Link to="/create-course" className="btn-primary">
  <BookOpenIcon className="mr-2 h-4 w-4" />
  Создать курс
</Link>

// Статистика курсов
<div>
  <p>Активных курсов: {activeCourses}</p>
  <p>Завершено курсов: {completedCourses}</p>
  <p>Студентов обучается: {totalStudents}</p>
</div>
```

---

### **📝 Создание курса - 3-этапный мастер**

**Файл:** `apps/web-app/src/pages/CreateCoursePage.tsx` (**528 строк**)

#### **Шаг 1: Основная информация**
- **Название курса** (обязательно, мин. 3 символа)
- **Полное описание** (обязательно, мин. 10 символов, поддержка Markdown)
- **Краткое описание** для превью в каталоге

#### **Шаг 2: Категория и сложность**
- **Категории:** Программирование, Дизайн, Бизнес, Маркетинг, Языки, и др.
- **Сложность:** Начинающий, Средний, Продвинутый, Эксперт
- **Длительность** курса в минутах
- **Теги** для поиска и SEO

#### **Шаг 3: Дополнительные настройки**
- **Цена курса** (RUB/USD/EUR) или бесплатный
- **Обложка и миниатюра** (URLs изображений)
- **Премиум статус** для дополнительной видимости
- **SEO настройки** (мета-заголовок, описание)

**Ключевые возможности:**
```tsx
const categoryLabels: Record<CourseCategory, string> = {
  [CourseCategory.PROGRAMMING]: 'Программирование',
  [CourseCategory.WEB_DEVELOPMENT]: 'Веб-разработка',
  [CourseCategory.MOBILE_DEVELOPMENT]: 'Мобильная разработка',
  [CourseCategory.DATA_SCIENCE]: 'Data Science',
  [CourseCategory.DEVOPS]: 'DevOps',
  [CourseCategory.DESIGN]: 'Дизайн',
  [CourseCategory.BUSINESS]: 'Бизнес',
  [CourseCategory.MARKETING]: 'Маркетинг',
  [CourseCategory.LANGUAGES]: 'Языки',
  [CourseCategory.OTHER]: 'Другое',
}

// Создание курса
const createCourseMutation = useMutation({
  mutationFn: coursesApi.createCourse,
  onSuccess: (course) => {
    toast.success('Курс успешно создан!')
    navigate(`/courses/${course.slug}`)
  }
})
```

---

### **🎬 Редактор контента курса**

**Файл:** `apps/web-app/src/pages/CourseEditorPage.tsx` (**591 строка**)

#### **Основные возможности:**

**1. Управление уроками:**
- ➕ **Добавление уроков** с различными типами контента
- ✏️ **Редактирование** существующих уроков  
- 🗑️ **Удаление** уроков с подтверждением
- 🔄 **Изменение порядка** уроков

**2. Типы контента:**
```tsx
enum LessonContentType {
  TEXT = 'TEXT',           // 📝 Текстовый урок
  VIDEO = 'VIDEO',         // 🎥 Видео урок  
  AUDIO = 'AUDIO',         // 🎵 Аудио урок
  INTERACTIVE = 'INTERACTIVE'  // ✅ Интерактивный урок
}
```

**3. Настройки уроков:**
- **Название и содержание** (поддержка Markdown/HTML)
- **URL видео/аудио** для медиа уроков
- **Длительность** в минутах
- **Бесплатный урок** (доступен всем для превью)

**4. Предварительный просмотр:**
- 👀 **Просмотр курса** как увидят студенты
- 🤖 **Переход в Telegram бота** курса
- 📊 **Статистика** по урокам

---

### **📚 Управление курсами**

**Файл:** `apps/web-app/src/pages/MyCoursesPage.tsx`

#### **Функциональность:**
- 📋 **Список всех курсов** создателя
- 🔍 **Фильтрация:** все / опубликованные / черновики
- 📊 **Статистика** по каждому курсу:
  - Количество студентов
  - Средняя оценка
  - Доход
  - Количество уроков

#### **Действия с курсами:**
```tsx
// Публикация/снятие с публикации
const publishMutation = useMutation({
  mutationFn: ({ courseId, action }: { courseId: string; action: 'publish' | 'unpublish' }) =>
    action === 'publish' 
      ? coursesApi.publishCourse(courseId)
      : coursesApi.unpublishCourse(courseId)
})

// Удаление курса
const deleteMutation = useMutation({
  mutationFn: coursesApi.deleteCourse
})
```

---

## 🔧 **Backend API для создателей**

### **🌐 Course Service API**

**Файл:** `services/course-service/src/courses/courses.controller.ts`

#### **Основные эндпоинты:**

**1. Создание курса:**
```typescript
@Post()
async create(@Body() createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
  // Валидация создателя через Auth Service
  await this.validateCreator(createCourseDto.creatorId)
  
  return await this.coursesService.create(createCourseDto)
}
```

**2. Управление курсами:**
```typescript
@Get()
async findAll(@Query() filters: CoursesFilterDto): Promise<CourseResponseDto[]>

@Get(':slug')
async findBySlug(@Param('slug') slug: string): Promise<CourseResponseDto>

@Patch(':id')
async update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto)

@Delete(':id')
async remove(@Param('id') id: string)
```

**3. Управление уроками:**
```typescript
@Post('lessons')
async createLesson(@Body() createLessonDto: CreateLessonDto): Promise<LessonResponseDto>

@Patch('lessons/:id')
async updateLesson(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto)

@Delete('lessons/:id')
async deleteLesson(@Param('id') id: string)
```

---

### **📊 Схема данных курса**

**Таблица `courses`:**
```sql
CREATE TABLE courses (
    id                  UUID PRIMARY KEY,
    title              VARCHAR NOT NULL,
    slug               VARCHAR UNIQUE,
    description        TEXT,
    short_description  TEXT,
    cover_image_url    TEXT,
    thumbnail_url      TEXT,
    
    -- 📖 Контент
    category           CourseCategory,     -- PROGRAMMING, DESIGN, etc.
    difficulty         CourseDifficulty,   -- BEGINNER, INTERMEDIATE, etc.
    language           VARCHAR DEFAULT 'ru',
    estimated_duration INT,               -- в минутах
    
    -- 💰 Монетизация
    price              DECIMAL(10,2),
    currency           VARCHAR DEFAULT 'USD',
    is_premium         BOOLEAN DEFAULT FALSE,
    is_published       BOOLEAN DEFAULT FALSE,
    
    -- 👨‍🏫 Авторство
    creator_id         VARCHAR,           -- ID из Auth Service
    collaborator_ids   VARCHAR[] DEFAULT '{}',
    
    -- 📊 Аналитика
    view_count         INT DEFAULT 0,
    enrollment_count   INT DEFAULT 0,
    completion_count   INT DEFAULT 0,
    average_rating     DECIMAL(3,2),
    
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);
```

---

## 🤖 **Telegram Bot Integration**

### **🔗 Автоматический Bot для каждого курса**

Когда создатель публикует курс, автоматически создается:

**1. Персональный Telegram Bot:**
- Уникальное имя: `@course_python_basics_bot`
- Настроенные команды: `/start`, `/courses`, `/progress`
- WebApp кнопки для запуска Mini-App

**2. Mini-App интеграция:**
```typescript
// WebApp кнопка в боте
{
  text: '🚀 Начать изучение',
  web_app: {
    url: `https://gongbu.appletownworld.com/student/${course.slug}`
  }
}
```

**3. Уведомления студентов:**
- Новые уроки
- Напоминания о изучении
- Достижения и прогресс

---

## 💰 **Монетизация курсов**

### **💳 Система платежей**

**1. Типы курсов:**
- 🆓 **Бесплатные** - доступны всем
- 💰 **Платные** - требуют покупки
- ⭐ **Премиум** - дополнительная видимость

**2. Поддерживаемые валюты:**
- 🇷🇺 RUB (рубли)
- 🇺🇸 USD (доллары)  
- 🇪🇺 EUR (евро)

**3. Интеграция с платежными системами:**
- 💳 Stripe
- 💰 YooKassa (ЮKassa)
- 📱 Telegram Payments API

### **📊 Доходы создателя**

**Схема `enrollments` отслеживает:**
```sql
CREATE TABLE enrollments (
    student_id      VARCHAR,
    course_id       UUID,
    payment_id      VARCHAR,       -- ID транзакции
    paid_amount     DECIMAL(10,2), -- Сумма оплаты
    discount_code   VARCHAR,       -- Промокод
    created_at      TIMESTAMP
);
```

---

## 📈 **Аналитика для создателей**

### **📊 Метрики курса**

**Доступная аналитика:**
- 👥 **Студенты:** записано, активно изучают, завершили
- ⭐ **Рейтинг:** средняя оценка, количество отзывов
- 💰 **Доходы:** общий доход, доход за период
- 📚 **Уроки:** просмотры, время изучения
- 🎯 **Конверсия:** от просмотра к записи, от записи к завершению

### **🔍 Детальная статистика**

**Таблица `student_progress`:**
```sql
-- Прогресс каждого студента
CREATE TABLE student_progress (
    student_id            VARCHAR,
    course_id             UUID,
    completed_lessons     INT,        -- Завершенные уроки
    progress_percentage   DECIMAL,    -- Процент прогресса
    time_spent           INT,        -- Время изучения (минуты)
    average_score        DECIMAL,    -- Средний балл за тесты
    last_accessed_at     TIMESTAMP,  -- Последняя активность
);
```

---

## 🎯 **Полный пользовательский опыт создателя**

### **🚀 Сценарий: Создание курса "Python для начинающих"**

#### **Шаг 1: Регистрация как CREATOR**
1. Пользователь регистрируется через Telegram
2. В профиле выбирает роль "Создатель курсов"
3. Получает доступ к панели создателя

#### **Шаг 2: Создание курса**
1. **Dashboard** → "Создать курс"
2. **Мастер создания курса:**
   - Название: "Python для начинающих"
   - Описание: "Изучите Python с нуля за 30 дней"
   - Категория: Программирование
   - Сложность: Начинающий
   - Цена: 2999 RUB

#### **Шаг 3: Добавление уроков**
1. **Редактор курса** → "Добавить урок"
2. **Урок 1:** "Установка Python" (текст + видео)
3. **Урок 2:** "Первая программа" (интерактивный)
4. **Урок 3:** "Переменные и типы данных" (видео)

#### **Шаг 4: Публикация**
1. **Предварительный просмотр** курса
2. **Публикация** курса
3. **Автоматически создается:**
   - Telegram Bot: `@python_beginners_course_bot`
   - WebApp интеграция
   - Страница в каталоге курсов

#### **Шаг 5: Продвижение**
1. **Получение ссылок:**
   - Ссылка на курс: `gongbu.com/courses/python-for-beginners`
   - Ссылка на бота: `t.me/python_beginners_course_bot`
2. **Продвижение в соц.сетях** и Telegram каналах
3. **Отслеживание метрик** в личном кабинете

---

## 🎊 **Преимущества платформы для создателей**

### **🚀 Технические преимущества**
- ⚡ **Мгновенное создание** - курс готов за минуты
- 🤖 **Автоматический бот** - не нужно настраивать самостоятельно
- 📱 **Mini-App** - современный интерфейс обучения
- 🔄 **Автоматическая синхронизация** между устройствами
- 📊 **Реалтайм аналитика** - живые данные

### **💰 Бизнес преимущества**  
- 🌍 **Глобальный охват** - 700+ млн пользователей Telegram
- 💳 **Встроенная оплата** - Telegram Payments
- 📈 **Низкий барьер входа** для студентов
- 🔥 **Высокая конверсия** - обучение в привычном мессенджере
- 💬 **Прямая связь** со студентами через бота

### **🎯 Маркетинговые преимущества**
- 🔍 **SEO оптимизация** - курсы индексируются поисковиками
- 📱 **Вирусное распространение** - легко делиться в Telegram
- 🏷️ **Система тегов** - студенты легко находят курсы
- ⭐ **Система отзывов** - социальное доказательство
- 🎁 **Промокоды** - маркетинговые акции

---

## 📋 **Checklist для создателя курса**

### **✅ Подготовка курса:**
- [ ] Определиться с темой и целевой аудиторией
- [ ] Подготовить план курса (10-20 уроков)
- [ ] Создать материалы (тексты, видео, задания)
- [ ] Подготовить обложку курса (рекомендуемый размер: 1200x630px)

### **✅ Создание в системе:**
- [ ] Зарегистрироваться и получить роль CREATOR
- [ ] Создать курс через 3-этапный мастер
- [ ] Добавить все уроки через редактор
- [ ] Настроить цену и условия доступа
- [ ] Сделать предварительный просмотр

### **✅ Публикация:**
- [ ] Опубликовать курс
- [ ] Протестировать Telegram Bot
- [ ] Проверить работу Mini-App
- [ ] Настроить уведомления студентов

### **✅ Продвижение:**
- [ ] Поделиться ссылкой на курс в соц.сетях
- [ ] Добавить бота в Telegram каналы
- [ ] Создать промо-материалы
- [ ] Отслеживать аналитику

---

## 🎯 **Заключение**

**Gongbu Platform предоставляет создателям курсов полноценную экосистему:**

### **✨ Что получает создатель курса:**
1. **🎨 Интуитивные инструменты** создания контента
2. **🤖 Автоматизированный Telegram Bot** для каждого курса  
3. **📱 Современный Mini-App** для студентов
4. **💰 Встроенную систему монетизации**
5. **📊 Детальную аналитику** и метрики
6. **🌍 Доступ к огромной аудитории** Telegram

### **🚀 Результат:**
**От идеи до полноценного курса с ботом и Mini-App за 15 минут!**

**Создатель может сосредоточиться на контенте, а платформа возьмет на себя всю техническую сторону, маркетинг и взаимодействие со студентами.**

---

*Руководство создано для Gongbu Platform • 20 сентября 2025*
