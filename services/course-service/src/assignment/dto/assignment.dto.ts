import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsDateString, Min, Max } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  instructions: string;

  @IsString()
  type: 'text' | 'file_upload' | 'image' | 'video' | 'code';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxFileSize?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  points: number;
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  type?: 'text' | 'file_upload' | 'image' | 'video' | 'code';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxFileSize?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  points?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SubmitAssignmentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];
}

export class ReviewAssignmentDto {
  @IsString()
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  score?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
