# Course Service Module

**Сервис:** Course Management Service  
**Порт:** 3002  
**Язык:** TypeScript + NestJS + Prisma  
**Статус:** Core Business Service  

---

## 📋 Обзор

Course Service является центральным бизнес-сервисом платформы, отвечающим за управление курсами, этапами, квизами, заданиями и прогрессом студентов. Обеспечивает все CRUD операции с образовательным контентом.

## 🎯 Ответственности

### Основные функции
- **Course Management** - создание, редактирование, публикация курсов
- **Content Management** - управление этапами, текстом, медиа файлами
- **Quiz System** - создание и проверка квизов
- **Assignment System** - задания с проверкой преподавателем
- **Progress Tracking** - отслеживание прогресса студентов
- **Search & Discovery** - поиск курсов, категории, рекомендации

### Дополнительные функции
- **Content Versioning** - версионирование контента курсов
- **Collaboration** - совместная работа над курсами
- **Templates** - шаблоны курсов и этапов
- **Import/Export** - импорт и экспорт курсов
- **Content Analytics** - аналитика по контенту

## 🏗️ Database Schema

### Core Entities

#### Courses
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    long_description TEXT,
    
    -- Author info
    creator_id UUID NOT NULL, -- Reference to users table in auth service
    collaborators UUID[] DEFAULT '{}',
    
    -- Bot integration
    bot_token VARCHAR(255),
    bot_username VARCHAR(100),
    bot_id BIGINT,
    
    -- Publishing
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    
    -- Pricing
    pricing_model pricing_model DEFAULT 'free',
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'RUB',
    
    -- Categorization
    category VARCHAR(100),
    subcategory VARCHAR(100),
    tags TEXT[],
    language VARCHAR(10) DEFAULT 'ru',
    
    -- Difficulty and duration
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_duration INTEGER, -- в минутах
    
    -- Media
    thumbnail_url TEXT,
    preview_video_url TEXT,
    
    -- Stats (будут обновляться через triggers/events)
    rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    students_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Settings
    is_commentable BOOLEAN DEFAULT true,
    is_downloadable BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    max_students INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_courses_creator_id ON courses(creator_id);
CREATE INDEX idx_courses_published ON courses(is_published) WHERE is_published = true;
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_rating ON courses(rating DESC);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX idx_courses_slug ON courses(slug);

-- Full text search index
CREATE INDEX idx_courses_search ON courses USING gin(
    to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(description, ''))
);
```

#### Course Steps
```sql
CREATE TABLE course_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL, -- Structured content
    
    -- Type and behavior
    step_type step_type NOT NULL,
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    
    -- Pricing
    is_paid BOOLEAN DEFAULT false,
    step_price DECIMAL(10,2),
    
    -- Unlock conditions
    unlock_conditions JSONB DEFAULT '{}',
    prerequisites UUID[], -- Other step IDs required
    
    -- Timing
    estimated_duration INTEGER, -- в минутах
    time_limit INTEGER, -- лимит времени на выполнение
    
    -- Settings
    is_skippable BOOLEAN DEFAULT false,
    max_attempts INTEGER,
    passing_score INTEGER, -- для квизов
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_course_steps_course_id ON course_steps(course_id);
CREATE INDEX idx_course_steps_order ON course_steps(course_id, order_index);
CREATE INDEX idx_course_steps_type ON course_steps(step_type);

-- Ensure unique order within course
CREATE UNIQUE INDEX idx_course_steps_unique_order ON course_steps(course_id, order_index);
```

#### Student Progress
```sql
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- From auth service
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    step_id UUID REFERENCES course_steps(id) ON DELETE CASCADE,
    
    -- Progress status
    status progress_status DEFAULT 'not_started',
    is_completed BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0,
    
    -- Attempts and scoring
    attempts_count INTEGER DEFAULT 0,
    max_attempts_reached BOOLEAN DEFAULT false,
    current_score INTEGER,
    best_score INTEGER,
    
    -- Timing
    time_spent INTEGER DEFAULT 0, -- в секундах
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Data storage for step-specific progress
    progress_data JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, step_id)
);

-- Indexes
CREATE INDEX idx_student_progress_user_course ON student_progress(user_id, course_id);
CREATE INDEX idx_student_progress_step ON student_progress(step_id);
CREATE INDEX idx_student_progress_status ON student_progress(status);
CREATE INDEX idx_student_progress_completed ON student_progress(is_completed, completed_at);
```

#### Assignments
```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID REFERENCES course_steps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Assignment content
    assignment_data JSONB NOT NULL, -- Original assignment from step
    submission_data JSONB NOT NULL, -- Student's submission
    
    -- Review status
    status assignment_status DEFAULT 'pending',
    reviewed_by UUID, -- Teacher user ID
    reviewed_at TIMESTAMP,
    
    -- Scoring
    score INTEGER,
    max_score INTEGER,
    auto_score INTEGER, -- For automated grading
    
    -- Feedback
    teacher_comment TEXT,
    private_notes TEXT, -- For teacher's private notes
    
    -- Timing
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP,
    is_late BOOLEAN DEFAULT false,
    
    -- Resubmission
    attempt_number INTEGER DEFAULT 1,
    parent_assignment_id UUID REFERENCES assignments(id), -- For resubmissions
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_assignments_step_id ON assignments(step_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_reviewed_by ON assignments(reviewed_by);
CREATE INDEX idx_assignments_pending ON assignments(status) WHERE status = 'pending';
```

### Supporting Tables

#### Course Categories
```sql
CREATE TABLE course_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    parent_id UUID REFERENCES course_categories(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate categories
INSERT INTO course_categories (name, slug, description) VALUES
('Программирование', 'programming', 'Курсы по программированию и разработке'),
('Дизайн', 'design', 'Графический дизайн, UX/UI, веб-дизайн'),
('Маркетинг', 'marketing', 'Цифровой маркетинг, SMM, контент-маркетинг'),
('Языки', 'languages', 'Изучение иностранных языков'),
('Бизнес', 'business', 'Предпринимательство и бизнес-навыки'),
('Личностный рост', 'personal-growth', 'Развитие личности и soft skills');
```

#### Course Reviews
```sql
CREATE TABLE course_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Review content
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    title VARCHAR(255),
    comment TEXT,
    
    -- Metadata
    is_verified BOOLEAN DEFAULT false, -- Verified purchase
    is_featured BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    moderated_by UUID,
    moderated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(course_id, user_id) -- One review per user per course
);

CREATE INDEX idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX idx_course_reviews_rating ON course_reviews(rating);
CREATE INDEX idx_course_reviews_created_at ON course_reviews(created_at DESC);
```

## 📡 API Endpoints

### Course Management
```yaml
GET /courses
  description: Получение списка курсов с фильтрацией
  query: {
    page?: number = 1,
    limit?: number = 20,
    category?: string,
    subcategory?: string,
    language?: string,
    difficulty?: number,
    pricing?: 'free' | 'paid' | 'subscription',
    sort?: 'newest' | 'popular' | 'rating' | 'price',
    search?: string,
    featured?: boolean,
    creator_id?: string
  }
  response: {
    courses: Course[],
    total: number,
    page: number,
    pages: number,
    filters: {
      categories: Category[],
      languages: string[],
      pricing_models: string[]
    }
  }

GET /courses/:id
  description: Получение детальной информации о курсе
  params: { id: string }
  query: { include?: 'steps' | 'reviews' | 'stats' }
  response: Course & {
    steps?: CourseStep[],
    reviews?: Review[],
    stats?: CourseStats,
    user_progress?: UserProgress // если пользователь авторизован
  }

POST /courses
  description: Создание нового курса (только для creators)
  headers: { Authorization: Bearer <token> }
  body: {
    title: string,
    description: string,
    category: string,
    language?: string,
    difficulty_level?: number,
    pricing_model?: 'free' | 'paid' | 'subscription',
    price?: number,
    tags?: string[]
  }
  response: Course

PUT /courses/:id
  description: Обновление курса
  headers: { Authorization: Bearer <token> }
  params: { id: string }
  body: Partial<Course>
  response: Course

DELETE /courses/:id
  description: Удаление курса (soft delete)
  headers: { Authorization: Bearer <token> }
  params: { id: string }
  response: { success: boolean }

POST /courses/:id/publish
  description: Публикация курса
  headers: { Authorization: Bearer <token> }
  params: { id: string }
  response: {
    success: boolean,
    bot_username?: string,
    published_at: string
  }

POST /courses/:id/enroll
  description: Записаться на курс
  headers: { Authorization: Bearer <token> }
  params: { id: string }
  response: {
    success: boolean,
    enrollment_id: string,
    access_granted: boolean
  }
```

### Course Steps Management
```yaml
GET /courses/:courseId/steps
  description: Получение этапов курса
  params: { courseId: string }
  query: { 
    include_locked?: boolean = false,
    user_progress?: boolean = true 
  }
  response: CourseStep[] & {
    user_progress?: StepProgress[]
  }

POST /courses/:courseId/steps
  description: Добавление этапа к курсу
  headers: { Authorization: Bearer <token> }
  params: { courseId: string }
  body: {
    title: string,
    description?: string,
    content: StepContent,
    step_type: 'text' | 'video' | 'quiz' | 'assignment' | 'plugin',
    order_index: number,
    is_paid?: boolean,
    step_price?: number,
    estimated_duration?: number
  }
  response: CourseStep

PUT /courses/:courseId/steps/:stepId
  description: Обновление этапа
  headers: { Authorization: Bearer <token> }
  params: { courseId: string, stepId: string }
  body: Partial<CourseStep>
  response: CourseStep

DELETE /courses/:courseId/steps/:stepId
  description: Удаление этапа
  headers: { Authorization: Bearer <token> }
  params: { courseId: string, stepId: string }
  response: { success: boolean }

POST /courses/:courseId/steps/reorder
  description: Изменение порядка этапов
  headers: { Authorization: Bearer <token> }
  params: { courseId: string }
  body: {
    step_orders: Array<{ step_id: string, order_index: number }>
  }
  response: { success: boolean }
```

### Progress & Learning
```yaml
GET /courses/:courseId/progress
  description: Получение прогресса пользователя по курсу
  headers: { Authorization: Bearer <token> }
  params: { courseId: string }
  response: {
    course_progress: {
      completed_steps: number,
      total_steps: number,
      completion_percentage: number,
      time_spent: number,
      started_at: string,
      last_accessed_at: string
    },
    step_progress: StepProgress[]
  }

POST /steps/:stepId/start
  description: Начать этап
  headers: { Authorization: Bearer <token> }
  params: { stepId: string }
  response: {
    success: boolean,
    step_content: StepContent,
    progress: StepProgress
  }

POST /steps/:stepId/complete
  description: Завершить этап
  headers: { Authorization: Bearer <token> }
  params: { stepId: string }
  body: {
    time_spent: number,
    score?: number,
    answers?: any, // For quizzes
    submission?: any // For assignments
  }
  response: {
    success: boolean,
    progress: StepProgress,
    next_step?: CourseStep,
    achievements?: Achievement[]
  }

POST /steps/:stepId/submit-assignment
  description: Отправить задание на проверку
  headers: { Authorization: Bearer <token> }
  params: { stepId: string }
  body: {
    submission_data: {
      text?: string,
      files?: string[], // File URLs
      answers?: Record<string, any>
    },
    time_spent: number
  }
  response: Assignment
```

### Assignment Review (для преподавателей)
```yaml
GET /assignments/pending
  description: Получение заданий на проверку
  headers: { Authorization: Bearer <teacher-token> }
  query: {
    course_id?: string,
    step_id?: string,
    page?: number,
    limit?: number
  }
  response: {
    assignments: Assignment[],
    total: number,
    page: number,
    pages: number
  }

POST /assignments/:id/review
  description: Проверка задания
  headers: { Authorization: Bearer <teacher-token> }
  params: { id: string }
  body: {
    status: 'approved' | 'rejected' | 'needs_revision',
    score?: number,
    comment?: string,
    private_notes?: string
  }
  response: Assignment

POST /assignments/:id/request-revision
  description: Запросить доработку
  headers: { Authorization: Bearer <teacher-token> }
  params: { id: string }
  body: {
    comment: string,
    suggestions?: string[]
  }
  response: Assignment
```

## 🔧 Content Types & Structures

### Step Content Schema
```typescript
// Базовая структура контента этапа
interface BaseStepContent {
  type: 'text' | 'video' | 'quiz' | 'assignment' | 'plugin';
  title: string;
  description?: string;
  estimated_duration?: number;
}

// Текстовый контент
interface TextStepContent extends BaseStepContent {
  type: 'text';
  content: {
    text: string; // Markdown/HTML
    images?: Array<{
      url: string;
      alt: string;
      caption?: string;
    }>;
    attachments?: Array<{
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
  };
}

// Видео контент
interface VideoStepContent extends BaseStepContent {
  type: 'video';
  content: {
    video_url: string;
    thumbnail_url?: string;
    duration?: number;
    subtitles?: Array<{
      language: string;
      url: string;
    }>;
    chapters?: Array<{
      time: number;
      title: string;
    }>;
  };
}

// Квиз
interface QuizStepContent extends BaseStepContent {
  type: 'quiz';
  content: {
    questions: Array<{
      id: string;
      type: 'multiple_choice' | 'single_choice' | 'text' | 'number';
      question: string;
      options?: string[]; // For choice questions
      correct_answer: any;
      explanation?: string;
      points: number;
    }>;
    passing_score: number;
    randomize_questions: boolean;
    time_limit?: number; // в секундах
  };
}

// Задание
interface AssignmentStepContent extends BaseStepContent {
  type: 'assignment';
  content: {
    instructions: string;
    requirements: string[];
    submission_types: Array<'text' | 'file' | 'url' | 'code'>;
    max_file_size?: number; // в байтах
    allowed_file_types?: string[];
    rubric?: Array<{
      criterion: string;
      description: string;
      max_points: number;
    }>;
    examples?: Array<{
      title: string;
      description: string;
      url?: string;
    }>;
  };
}

// Плагин
interface PluginStepContent extends BaseStepContent {
  type: 'plugin';
  content: {
    plugin_id: string;
    plugin_version: string;
    configuration: Record<string, any>;
    custom_data?: Record<string, any>;
  };
}

type StepContent = TextStepContent | VideoStepContent | QuizStepContent | 
                   AssignmentStepContent | PluginStepContent;
```

### Course Statistics
```typescript
interface CourseStats {
  enrollment: {
    total_students: number;
    active_students: number; // Заходили за последние 30 дней
    completed_students: number;
  };
  
  progress: {
    average_completion_rate: number; // %
    average_time_to_complete: number; // дни
    dropout_points: Array<{
      step_id: string;
      step_title: string;
      dropout_rate: number;
    }>;
  };
  
  engagement: {
    average_session_duration: number; // минуты
    return_rate: number; // % студентов возвращающихся на курс
    average_rating: number;
    rating_count: number;
  };
  
  content: {
    total_steps: number;
    total_duration: number; // минуты
    content_types: Record<string, number>;
  };
  
  revenue?: {
    total_revenue: number;
    currency: string;
    average_revenue_per_student: number;
  };
}
```

## 📊 Business Logic Services

### Course Publishing Service
```typescript
@Injectable()
export class CoursePublishingService {
  async publishCourse(courseId: string, publisherId: string): Promise<PublishResult> {
    const course = await this.courseRepository.findById(courseId);
    
    // Валидация перед публикацией
    const validation = await this.validateForPublishing(course);
    if (!validation.isValid) {
      throw new BadRequestException('Course validation failed', validation.errors);
    }

    // Создание Telegram бота (через Bot Service)
    const botResult = await this.botServiceClient.createCourseBot({
      courseId: course.id,
      title: course.title,
      creatorId: publisherId
    });

    // Обновление курса
    const updatedCourse = await this.courseRepository.update(courseId, {
      is_published: true,
      published_at: new Date(),
      bot_token: botResult.token,
      bot_username: botResult.username,
      bot_id: botResult.botId
    });

    // Индексация в Elasticsearch для поиска
    await this.searchService.indexCourse(updatedCourse);

    // Отправка событий
    await this.eventBus.publish(new CoursePublishedEvent(updatedCourse));

    return {
      success: true,
      course: updatedCourse,
      bot_username: botResult.username
    };
  }

  private async validateForPublishing(course: Course): Promise<ValidationResult> {
    const errors: string[] = [];

    // Проверка минимального контента
    if (!course.title || course.title.length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (!course.description || course.description.length < 20) {
      errors.push('Description must be at least 20 characters long');
    }

    // Проверка наличия этапов
    const steps = await this.stepRepository.findByCourseId(course.id);
    if (steps.length === 0) {
      errors.push('Course must have at least one step');
    }

    // Проверка первого этапа (должен быть бесплатным)
    if (steps.length > 0 && steps[0].is_paid) {
      errors.push('First step must be free');
    }

    // Проверка категории
    if (!course.category) {
      errors.push('Course must have a category');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### Progress Calculation Service
```typescript
@Injectable()
export class ProgressCalculationService {
  async calculateCourseProgress(userId: string, courseId: string): Promise<CourseProgress> {
    const course = await this.courseRepository.findById(courseId);
    const steps = await this.stepRepository.findByCourseId(courseId);
    const progress = await this.progressRepository.findByUserAndCourse(userId, courseId);

    const totalSteps = steps.filter(step => step.is_required).length;
    const completedSteps = progress.filter(p => p.is_completed).length;
    
    const completionPercentage = totalSteps > 0 ? 
      Math.round((completedSteps / totalSteps) * 100) : 0;

    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
    
    const startedAt = progress.length > 0 ? 
      Math.min(...progress.map(p => p.created_at.getTime())) : null;

    const lastAccessedAt = progress.length > 0 ? 
      Math.max(...progress.map(p => p.last_accessed_at.getTime())) : null;

    return {
      course_id: courseId,
      user_id: userId,
      total_steps: totalSteps,
      completed_steps: completedSteps,
      completion_percentage: completionPercentage,
      time_spent: totalTimeSpent,
      started_at: startedAt ? new Date(startedAt) : null,
      last_accessed_at: lastAccessedAt ? new Date(lastAccessedAt) : null,
      estimated_time_remaining: this.estimateTimeRemaining(course, progress)
    };
  }

  private estimateTimeRemaining(course: Course, progress: StepProgress[]): number {
    const completedStepIds = new Set(
      progress.filter(p => p.is_completed).map(p => p.step_id)
    );

    const remainingSteps = course.steps.filter(
      step => !completedStepIds.has(step.id) && step.is_required
    );

    return remainingSteps.reduce(
      (sum, step) => sum + (step.estimated_duration || 0), 
      0
    );
  }
}
```

## 🔍 Search & Discovery

### Elasticsearch Integration
```typescript
@Injectable()
export class CourseSearchService {
  constructor(
    @Inject('ELASTICSEARCH_CLIENT') private esClient: Client
  ) {}

  async searchCourses(query: SearchQuery): Promise<SearchResult> {
    const searchBody = this.buildSearchQuery(query);
    
    const response = await this.esClient.search({
      index: 'courses',
      body: searchBody
    });

    return {
      courses: response.body.hits.hits.map(hit => hit._source),
      total: response.body.hits.total.value,
      aggregations: this.parseAggregations(response.body.aggregations),
      suggestions: this.parseSuggestions(response.body.suggest)
    };
  }

  private buildSearchQuery(query: SearchQuery) {
    const must = [];
    const filter = [];

    // Text search
    if (query.search) {
      must.push({
        multi_match: {
          query: query.search,
          fields: [
            'title^3',
            'description^2', 
            'tags',
            'category'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    }

    // Filters
    if (query.category) {
      filter.push({ term: { category: query.category } });
    }

    if (query.language) {
      filter.push({ term: { language: query.language } });
    }

    if (query.difficulty) {
      filter.push({ term: { difficulty_level: query.difficulty } });
    }

    if (query.pricing === 'free') {
      filter.push({ term: { pricing_model: 'free' } });
    } else if (query.pricing === 'paid') {
      filter.push({ 
        bool: {
          should: [
            { term: { pricing_model: 'paid' } },
            { term: { pricing_model: 'subscription' } }
          ]
        }
      });
    }

    // Only published courses
    filter.push({ term: { is_published: true } });

    // Sorting
    const sort = this.buildSortClause(query.sort);

    return {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter
        }
      },
      sort,
      from: ((query.page || 1) - 1) * (query.limit || 20),
      size: query.limit || 20,
      
      // Aggregations for filters
      aggs: {
        categories: { terms: { field: 'category' } },
        languages: { terms: { field: 'language' } },
        difficulty_levels: { terms: { field: 'difficulty_level' } },
        pricing_models: { terms: { field: 'pricing_model' } }
      },

      // Search suggestions
      suggest: {
        course_suggest: {
          prefix: query.search || '',
          completion: {
            field: 'title_suggest',
            size: 5
          }
        }
      }
    };
  }
}
```

## 📋 Implementation Checklist

### Phase 1: Core CRUD
- [ ] Basic course management (create, read, update, delete)
- [ ] Course step management
- [ ] Database schema and migrations
- [ ] Basic API endpoints
- [ ] Authentication integration

### Phase 2: Content System
- [ ] Rich content support (text, images, videos)
- [ ] File upload and management
- [ ] Content versioning
- [ ] Template system
- [ ] Import/export functionality

### Phase 3: Learning Features
- [ ] Progress tracking system
- [ ] Quiz engine implementation
- [ ] Assignment submission system
- [ ] Assignment review workflow
- [ ] Achievement system

### Phase 4: Discovery & Search
- [ ] Elasticsearch integration
- [ ] Full-text search
- [ ] Category and tag system
- [ ] Course recommendations
- [ ] Review and rating system

### Phase 5: Advanced Features
- [ ] Collaboration tools
- [ ] Analytics and reporting
- [ ] Content analytics
- [ ] Performance optimization
- [ ] Caching strategies

### Phase 6: Integration
- [ ] Bot Service integration
- [ ] Payment Service integration
- [ ] Notification Service events
- [ ] Analytics Service events
- [ ] Plugin Service support

---

## 🔗 Dependencies

### Internal Services
- Auth Service (user validation, permissions)
- Bot Service (bot creation for courses)
- Payment Service (course purchases, subscriptions)
- Notification Service (course updates, assignment notifications)
- Plugin Service (plugin content in steps)
- Analytics Service (usage statistics)

### External Dependencies
- PostgreSQL (primary data storage)
- Redis (caching, session storage)
- Elasticsearch (search and discovery)
- AWS S3/MinIO (file storage)
- Image processing service (thumbnails, optimization)

### Libraries
- `@prisma/client` - Database ORM
- `@nestjs/elasticsearch` - Search integration
- `multer` - File uploads
- `sharp` - Image processing
- `markdown-it` - Markdown processing
- `joi` - Data validation
