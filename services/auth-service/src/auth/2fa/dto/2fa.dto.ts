import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Enable2FADto {
  @ApiProperty({ description: '2FA verification token', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}

export class Verify2FADto {
  @ApiProperty({ description: '2FA token for verification', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}

export class Disable2FADto {
  @ApiProperty({ description: 'User password for verification', example: 'userpassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyBackupCodeDto {
  @ApiProperty({ description: 'Backup code for 2FA', example: 'A1B2C3D4' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  code: string;
}
