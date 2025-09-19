export interface Course {
  id: string
  title: string
  slug: string
  description: string
  shortDescription?: string
  coverImageUrl?: string
  thumbnailUrl?: string
  category: CourseCategory
  difficulty: CourseDifficulty
  language: string
  estimatedDuration?: number
  price?: number
  currency: string
  isPremium: boolean
  isPublished: boolean
  publishedAt?: string
  tags: string[]
  metaTitle?: string
  metaDescription?: string
  creatorId: string
  collaboratorIds: string[]
  lessonCount: number
  enrollmentCount: number
  averageRating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
  creator?: CourseCreator
}

export interface CourseCreator {
  id: string
  name: string
  avatar?: string
}

// Lesson interface moved down to avoid duplication

export enum CourseCategory {
  PROGRAMMING = 'PROGRAMMING',
  DATA_SCIENCE = 'DATA_SCIENCE',
  WEB_DEVELOPMENT = 'WEB_DEVELOPMENT',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
  DEVOPS = 'DEVOPS',
  DESIGN = 'DESIGN',
  BUSINESS = 'BUSINESS',
  MARKETING = 'MARKETING',
  LANGUAGES = 'LANGUAGES',
  OTHER = 'OTHER',
}

export enum CourseDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export interface CourseFilters {
  page?: number
  limit?: number
  category?: CourseCategory
  difficulty?: CourseDifficulty
  search?: string
  language?: string
  minPrice?: number
  maxPrice?: number
  tags?: string
  creatorId?: string
  isPublished?: boolean
  isPremium?: boolean
}

export interface CoursesResponse {
  courses: Course[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface CourseStats {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  totalEnrollments: number
  activeStudents: number
  averageRating: number
  categoriesStats: Record<CourseCategory, number>
  difficultyStats: Record<CourseDifficulty, number>
}

// Lesson types
export interface Lesson {
  id: string
  title: string
  description?: string
  content?: string
  contentType: LessonContentType
  videoUrl?: string
  audioUrl?: string
  attachments: LessonAttachment[]
  duration?: number
  order: number
  isPublished: boolean
  isFree: boolean
  prerequisites: string[]
  learningObjectives: string[]
  createdAt: string
  updatedAt: string
}

export enum LessonContentType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  INTERACTIVE = 'INTERACTIVE',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
}

export interface LessonAttachment {
  id: string
  title: string
  type: AttachmentType
  url: string
  size?: number
  mimeType?: string
}

export enum AttachmentType {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  ARCHIVE = 'ARCHIVE',
  CODE = 'CODE',
}

// Progress types
export interface StudentProgress {
  courseId: string
  userId: string
  enrolledAt: string
  lastAccessedAt?: string
  completedLessons: number
  totalLessons: number
  progressPercentage: number
  status: ProgressStatus
  timeSpent: number
  certificateIssued: boolean
}

export enum ProgressStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  DROPPED = 'DROPPED',
}

export interface LessonProgress {
  lessonId: string
  lesson: {
    id: string
    title: string
    order: number
    duration?: number
  }
  timeSpent: number
  completed: boolean
  score?: number
  startedAt?: string
  lastAccessedAt?: string
  progressPercentage: number
}

export interface UserCourses {
  enrolled: Course[]
  completed: Course[]
  inProgress: Course[]
}
