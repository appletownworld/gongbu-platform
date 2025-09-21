import { Controller, Post, Get, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TwoFactorService } from './2fa.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Enable2FADto, Verify2FADto, Disable2FADto, VerifyBackupCodeDto } from './dto/2fa.dto';

@ApiTags('2FA')
@Controller('2fa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiResponse({ status: 200, description: '2FA secret generated successfully' })
  async generateSecret(@Request() req) {
    const userId = req.user.id;
    return await this.twoFactorService.generateSecret(userId);
  }

  @Post('enable')
  @ApiOperation({ summary: 'Enable 2FA with verification token' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  async enable2FA(@Request() req, @Body() enable2FADto: Enable2FADto) {
    const userId = req.user.id;
    const isValid = await this.twoFactorService.verifyAndEnable2FA(userId, enable2FADto.token);
    
    if (isValid) {
      return { message: '2FA enabled successfully', enabled: true };
    } else {
      throw new Error('Invalid 2FA token');
    }
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify 2FA token for login' })
  @ApiResponse({ status: 200, description: '2FA token verified successfully' })
  async verifyToken(@Request() req, @Body() verify2FADto: Verify2FADto) {
    const userId = req.user.id;
    const isValid = await this.twoFactorService.verify2FAToken(userId, verify2FADto.token);
    
    if (isValid) {
      return { message: '2FA token verified successfully', verified: true };
    } else {
      throw new Error('Invalid 2FA token');
    }
  }

  @Delete('disable')
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  async disable2FA(@Request() req, @Body() disable2FADto: Disable2FADto) {
    const userId = req.user.id;
    const success = await this.twoFactorService.disable2FA(userId, disable2FADto.password);
    
    if (success) {
      return { message: '2FA disabled successfully', disabled: true };
    } else {
      throw new Error('Failed to disable 2FA');
    }
  }

  @Get('backup-codes')
  @ApiOperation({ summary: 'Generate backup codes for 2FA' })
  @ApiResponse({ status: 200, description: 'Backup codes generated successfully' })
  async generateBackupCodes(@Request() req) {
    const userId = req.user.id;
    const codes = await this.twoFactorService.generateBackupCodes(userId);
    return { backupCodes: codes };
  }

  @Post('backup-codes/verify')
  @ApiOperation({ summary: 'Verify backup code' })
  @ApiResponse({ status: 200, description: 'Backup code verified successfully' })
  async verifyBackupCode(@Request() req, @Body() verifyBackupCodeDto: VerifyBackupCodeDto) {
    const userId = req.user.id;
    const isValid = await this.twoFactorService.verifyBackupCode(userId, verifyBackupCodeDto.code);
    
    if (isValid) {
      return { message: 'Backup code verified successfully', verified: true };
    } else {
      throw new Error('Invalid backup code');
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Check 2FA status' })
  @ApiResponse({ status: 200, description: '2FA status retrieved successfully' })
  async get2FAStatus(@Request() req) {
    const userId = req.user.id;
    const isEnabled = await this.twoFactorService.is2FAEnabled(userId);
    return { enabled: isEnabled };
  }
}
