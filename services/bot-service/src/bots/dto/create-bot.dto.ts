import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateBotDto {
  @ApiProperty({ description: 'ID курса для которого создается бот' })
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'ID создателя курса' })
  @IsString()
  creatorId: string;

  @ApiProperty({ description: 'Название бота' })
  @IsString()
  botName: string;

  @ApiProperty({ description: 'Описание бота', required: false })
  @IsOptional()
  @IsString()
  botDescription?: string;

  @ApiProperty({ description: 'Приветственное сообщение', required: false })
  @IsOptional()
  @IsString()
  welcomeMessage?: string;

  @ApiProperty({ description: 'Настройки бота', required: false })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdateBotSettingsDto {
  @ApiProperty({ description: 'Название бота', required: false })
  @IsOptional()
  @IsString()
  botName?: string;

  @ApiProperty({ description: 'Описание бота', required: false })
  @IsOptional()
  @IsString()
  botDescription?: string;

  @ApiProperty({ description: 'Приветственное сообщение', required: false })
  @IsOptional()
  @IsString()
  welcomeMessage?: string;

  @ApiProperty({ description: 'Настройки бота', required: false })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class SetWebhookDto {
  @ApiProperty({ description: 'URL для webhook' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Секретный токен', required: false })
  @IsOptional()
  @IsString()
  secret_token?: string;

  @ApiProperty({ description: 'Максимальное количество соединений', required: false })
  @IsOptional()
  max_connections?: number;
}
