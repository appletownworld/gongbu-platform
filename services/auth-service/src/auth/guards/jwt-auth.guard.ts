import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtTokenService } from '../jwt-token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly jwtTokenService: JwtTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.debug('No Bearer token provided');
      throw new UnauthorizedException('Bearer token required');
    }

    try {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const userContext = await this.jwtTokenService.validateAccessToken(token);
      
      // Attach user context to request
      request.user = userContext;
      
      this.logger.debug(`Authenticated user: ${userContext.userId}`);
      return true;
    } catch (error) {
      this.logger.debug('Token validation failed', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
