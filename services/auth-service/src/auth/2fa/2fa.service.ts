import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate 2FA secret for user
   */
  async generateSecret(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    const appName = this.configService.get('APP_NAME', 'Gongbu Platform');
    const userEmail = user.email;

    // Generate QR code URL
    const otpAuthUrl = authenticator.keyuri(userEmail, appName, secret);
    const qrCodeUrl = await toDataURL(otpAuthUrl);

    // Store secret temporarily (encrypted)
    const encryptedSecret = this.encryptSecret(secret);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorEnabled: false, // Will be enabled after verification
      },
    });

    return {
      secret,
      qrCodeUrl,
    };
  }

  /**
   * Verify 2FA token and enable 2FA
   */
  async verifyAndEnable2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not initialized');
    }

    const secret = this.decryptSecret(user.twoFactorSecret);
    const isValid = authenticator.verify({ token, secret });

    if (isValid) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
        },
      });
      return true;
    }

    return false;
  }

  /**
   * Verify 2FA token for login
   */
  async verify2FAToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA not enabled');
    }

    const secret = this.decryptSecret(user.twoFactorSecret);
    return authenticator.verify({ token, secret });
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify password before disabling 2FA
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return true;
  }

  /**
   * Generate backup codes for 2FA
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    const hashedCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: hashedCodes,
      },
    });

    return backupCodes;
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorBackupCodes) {
      return false;
    }

    const hashedCode = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
    const codeIndex = user.twoFactorBackupCodes.indexOf(hashedCode);

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    const updatedCodes = user.twoFactorBackupCodes.filter((_, index) => index !== codeIndex);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: updatedCodes,
      },
    });

    return true;
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled || false;
  }

  /**
   * Encrypt 2FA secret
   */
  private encryptSecret(secret: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      this.configService.get('ENCRYPTION_KEY', 'default-key'),
      'salt',
      32
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('2fa-secret', 'utf8'));
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt 2FA secret
   */
  private decryptSecret(encryptedSecret: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      this.configService.get('ENCRYPTION_KEY', 'default-key'),
      'salt',
      32
    );
    
    const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('2fa-secret', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Verify password (placeholder - implement proper password verification)
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    // Implement proper password verification with bcrypt
    // This is a placeholder
    return true;
  }
}
