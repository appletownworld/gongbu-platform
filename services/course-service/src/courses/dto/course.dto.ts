import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsBoolean, 
  IsArray, 
  IsEnum,
  IsUrl,
  Min,
  Max,
  IsDecimal,
  ValidateNested,
  ArrayMinSize,
  Length
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CourseDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

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
  OTHER = 'OTHER'
}

export class CreateCourseDto {
  @ApiProperty({ example: 'Python для начинающих' })
  @IsString()
  @Length(3, 200)
  title: string;

  @ApiPropertyOptional({ example: 'python-for-beginners' })
  @IsOptional()
  @IsString()
  @Length(3, 200)
  slug?: string;

  @ApiProperty({ example: 'Полный курс по программированию на Python' })
  @IsString()
  @Length(10, 5000)
  description: string;

  @ApiPropertyOptional({ example: 'Изучите Python за 30 дней' })
  @IsOptional()
  @IsString()
  @Length(10, 300)
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/course-cover.jpg' })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/course-thumb.jpg' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({ enum: CourseCategory, example: CourseCategory.PROGRAMMING })
  @IsEnum(CourseCategory)
  category: CourseCategory;

  @ApiProperty({ enum: CourseDifficulty, example: CourseDifficulty.BEGINNER })
  @IsEnum(CourseDifficulty)
  difficulty: CourseDifficulty;

  @ApiPropertyOptional({ example: 'ru' })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  language?: string;

  @ApiPropertyOptional({ example: 2400 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: 49.99 })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => parseFloat(value))
  price?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ example: ['python', 'programming', 'beginner'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  tags?: string[];

  @ApiPropertyOptional({ example: 'Python для начинающих - SEO заголовок' })
  @IsOptional()
  @IsString()
  @Length(10, 200)
  metaTitle?: string;

  @ApiPropertyOptional({ example: 'Описание курса для SEO' })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  metaDescription?: string;

  @ApiProperty({ example: 'user-123' })
  @IsString()
  creatorId: string;

  @ApiPropertyOptional({ example: ['user-456', 'user-789'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collaboratorIds?: string[];
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Python для начинающих - обновленное название' })
  @IsOptional()
  @IsString()
  @Length(3, 200)
  title?: string;

  @ApiPropertyOptional({ example: 'Обновленное описание курса' })
  @IsOptional()
  @IsString()
  @Length(10, 5000)
  description?: string;

  @ApiPropertyOptional({ example: 'Краткое описание' })
  @IsOptional()
  @IsString()
  @Length(10, 300)
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-cover.jpg' })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-thumb.jpg' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: CourseCategory })
  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @ApiPropertyOptional({ enum: CourseDifficulty })
  @IsOptional()
  @IsEnum(CourseDifficulty)
  difficulty?: CourseDifficulty;

  @ApiPropertyOptional({ example: 'ru' })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  language?: string;

  @ApiPropertyOptional({ example: 3600 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: 59.99 })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => parseFloat(value))
  price?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: ['python', 'advanced', 'programming'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Новый SEO заголовок' })
  @IsOptional()
  @IsString()
  @Length(10, 200)
  metaTitle?: string;

  @ApiPropertyOptional({ example: 'Новое SEO описание' })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  metaDescription?: string;

  @ApiPropertyOptional({ example: ['user-456', 'user-789'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collaboratorIds?: string[];
}

export class CourseQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: CourseCategory })
  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @ApiPropertyOptional({ enum: CourseDifficulty })
  @IsOptional()
  @IsEnum(CourseDifficulty)
  difficulty?: CourseDifficulty;

  @ApiPropertyOptional({ example: 'python' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  search?: string;

  @ApiPropertyOptional({ example: 'ru' })
  @IsOptional()
  @IsString()
  @Length(2, 5)
  language?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'python,programming' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ example: 'user-123' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPremium?: boolean;
}

// Response DTOs
export class CourseResponseDto {
  @ApiProperty({ example: 'course-123' })
  id: string;

  @ApiProperty({ example: 'Python для начинающих' })
  title: string;

  @ApiProperty({ example: 'python-for-beginners' })
  slug: string;

  @ApiProperty({ example: 'Полный курс по программированию на Python' })
  description: string;

  @ApiPropertyOptional({ example: 'Изучите Python за 30 дней' })
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/course-cover.jpg' })
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/course-thumb.jpg' })
  thumbnailUrl?: string;

  @ApiProperty({ enum: CourseCategory })
  category: CourseCategory;

  @ApiProperty({ enum: CourseDifficulty })
  difficulty: CourseDifficulty;

  @ApiProperty({ example: 'ru' })
  language: string;

  @ApiPropertyOptional({ example: 2400 })
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: 49.99 })
  price?: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: false })
  isPremium: boolean;

  @ApiProperty({ example: true })
  isPublished: boolean;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiProperty({ example: ['python', 'programming', 'beginner'] })
  tags: string[];

  @ApiPropertyOptional({ example: 'Python для начинающих - SEO заголовок' })
  metaTitle?: string;

  @ApiPropertyOptional({ example: 'Описание курса для SEO' })
  metaDescription?: string;

  @ApiProperty({ example: 'user-123' })
  creatorId: string;

  @ApiProperty({ example: ['user-456'] })
  collaboratorIds: string[];

  // Statistics
  @ApiProperty({ example: 24 })
  lessonCount: number;

  @ApiProperty({ example: 1247 })
  enrollmentCount: number;

  @ApiProperty({ example: 4.8 })
  averageRating: number;

  @ApiProperty({ example: 156 })
  reviewCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Creator info (populated from auth service)
  @ApiPropertyOptional()
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export class CourseListResponseDto {
  @ApiProperty({ type: [CourseResponseDto] })
  courses: CourseResponseDto[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class CourseStatsResponseDto {
  @ApiProperty({ example: 1247 })
  totalCourses: number;

  @ApiProperty({ example: 892 })
  publishedCourses: number;

  @ApiProperty({ example: 355 })
  draftCourses: number;

  @ApiProperty({ example: 12847 })
  totalEnrollments: number;

  @ApiProperty({ example: 8923 })
  activeStudents: number;

  @ApiProperty({ example: 4.7 })
  averageRating: number;

  @ApiProperty()
  categoriesStats: {
    [key in CourseCategory]: number;
  };

  @ApiProperty()
  difficultyStats: {
    [key in CourseDifficulty]: number;
  };
}
