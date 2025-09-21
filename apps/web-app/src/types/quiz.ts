// Quiz types
export interface Quiz {
  id: string
  title: string
  description?: string
  courseId: string
  lessonId?: string
  questions: QuizQuestion[]
  timeLimit?: number // in minutes
  passingScore: number // percentage
  maxAttempts?: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: QuizQuestionType
  options?: QuizOption[]
  correctAnswer?: string | string[]
  explanation?: string
  points: number
  order: number
  isRequired: boolean
}

export enum QuizQuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  TEXT_INPUT = 'TEXT_INPUT',
  FILE_UPLOAD = 'FILE_UPLOAD',
  VOICE_RECORDING = 'VOICE_RECORDING',
}

export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
  order: number
}

// Quiz attempt types
export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  answers: QuizAnswer[]
  score: number
  percentage: number
  timeSpent: number // in seconds
  isPassed: boolean
  startedAt: string
  completedAt?: string
  status: QuizAttemptStatus
}

export enum QuizAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
  TIMED_OUT = 'TIMED_OUT',
}

export interface QuizAnswer {
  questionId: string
  answer: string | string[] | File
  isCorrect: boolean
  points: number
  timeSpent: number // in seconds
}

// Assignment types
export interface Assignment {
  id: string
  title: string
  description: string
  courseId: string
  lessonId?: string
  instructions: string
  requirements?: string[]
  attachments?: AssignmentAttachment[]
  dueDate?: string
  maxPoints: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface AssignmentAttachment {
  id: string
  title: string
  type: AssignmentAttachmentType
  url: string
  size?: number
  mimeType?: string
}

export enum AssignmentAttachmentType {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  TEMPLATE = 'TEMPLATE',
}

// Assignment submission types
export interface AssignmentSubmission {
  id: string
  assignmentId: string
  userId: string
  content: string
  attachments: SubmissionAttachment[]
  submittedAt: string
  status: AssignmentSubmissionStatus
  score?: number
  feedback?: string
  gradedBy?: string
  gradedAt?: string
}

export enum AssignmentSubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  RETURNED = 'RETURNED',
  RESUBMITTED = 'RESUBMITTED',
}

export interface SubmissionAttachment {
  id: string
  title: string
  type: AssignmentAttachmentType
  url: string
  size?: number
  mimeType?: string
}

// Teacher dashboard types
export interface TeacherDashboard {
  pendingSubmissions: AssignmentSubmission[]
  pendingReviews: QuizAttempt[]
  studentProgress: StudentProgressSummary[]
  courseStats: any
}

export interface StudentProgressSummary {
  userId: string
  userName: string
  courseId: string
  completedLessons: number
  totalLessons: number
  completedQuizzes: number
  totalQuizzes: number
  submittedAssignments: number
  totalAssignments: number
  averageScore: number
  lastActivity: string
}

// Quiz/Assignment creation DTOs
export interface CreateQuizDto {
  title: string
  description?: string
  courseId: string
  lessonId?: string
  timeLimit?: number
  passingScore: number
  maxAttempts?: number
  questions: CreateQuizQuestionDto[]
}

export interface CreateQuizQuestionDto {
  question: string
  type: QuizQuestionType
  options?: CreateQuizOptionDto[]
  correctAnswer?: string | string[]
  explanation?: string
  points: number
  order: number
  isRequired: boolean
  timeLimit?: number
}

export interface CreateQuizOptionDto {
  text: string
  isCorrect: boolean
  order: number
}

export interface CreateAssignmentDto {
  title: string
  description: string
  courseId: string
  lessonId?: string
  instructions: string
  requirements?: string[]
  dueDate?: string
  maxPoints: number
}

// API response types
export interface QuizResponse {
  quiz: Quiz
  attempts?: QuizAttempt[]
  statistics?: QuizStatistics
}

export interface QuizStatistics {
  totalAttempts: number
  averageScore: number
  passRate: number
  questionStatistics: QuestionStatistics[]
}

export interface QuestionStatistics {
  questionId: string
  correctAnswers: number
  totalAnswers: number
  averageTime: number
  difficulty: number
}

export interface AssignmentResponse {
  assignment: Assignment
  submissions?: AssignmentSubmission[]
  statistics?: AssignmentStatistics
}

export interface AssignmentStatistics {
  totalSubmissions: number
  averageScore: number
  completionRate: number
  pendingReviews: number
}
