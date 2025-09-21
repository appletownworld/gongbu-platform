import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizQuestionDto {
  @IsString()
  id: string;

  @IsString()
  type: 'multiple_choice' | 'single_choice' | 'text' | 'file_upload' | 'voice';

  @IsString()
  question: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  correctAnswer?: string | number | string[];

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsNumber()
  @Min(1)
  points: number;

  @IsNumber()
  @Min(1)
  order: number;
}

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  timeLimit?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxAttempts?: number;
}

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions?: QuizQuestionDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  timeLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxAttempts?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SubmitQuizAnswerDto {
  @IsArray()
  answers: Record<string, any>;

  @IsNumber()
  @Min(0)
  timeSpent: number; // в секундах

  @IsString()
  startedAt: string; // ISO string
}

export class QuizAttemptDto {
  @IsString()
  id: string;

  @IsString()
  quizId: string;

  @IsString()
  userId: string;

  @IsNumber()
  score: number;

  @IsBoolean()
  passed: boolean;

  @IsNumber()
  timeSpent: number;

  @IsString()
  completedAt: string;
}

export class QuizStatsDto {
  @IsString()
  quizId: string;

  @IsNumber()
  totalAttempts: number;

  @IsNumber()
  passedAttempts: number;

  @IsNumber()
  failedAttempts: number;

  @IsNumber()
  passRate: number;

  @IsNumber()
  averageScore: number;

  @IsNumber()
  averageTimeSpent: number;
}
