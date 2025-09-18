import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Service info' })
  getInfo() {
    return this.appService.getServiceInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async getHealth() {
    const dbHealth = await this.prisma.healthCheck();
    
    return {
      status: 'OK',
      service: 'Bot Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: dbHealth,
    };
  }
}
