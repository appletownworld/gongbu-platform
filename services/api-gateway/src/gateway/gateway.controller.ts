import {
  Controller,
  All,
  Req,
  Res,
  Param,
  Logger,
  HttpException,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ProxyService, ProxyRequest } from '../proxy/proxy.service';
import { GatewayAuthGuard } from '../guards/auth.guard';

@ApiTags('Gateway')
@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @Get('services')
  @ApiOperation({ 
    summary: 'Get list of available microservices',
    description: 'Returns information about all registered microservices and their health status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of services with their configuration and status',
    schema: {
      type: 'object',
      properties: {
        services: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              baseUrl: { type: 'string' },
              timeout: { type: 'number' },
              status: { type: 'string' }
            }
          }
        },
        totalServices: { type: 'number' },
        timestamp: { type: 'string' }
      }
    }
  })
  async getServices() {
    try {
      const services = this.proxyService.getRegisteredServices();
      const healthStatus = await this.proxyService.checkServicesHealth();

      // Combine service config with health status
      const servicesWithHealth = Object.entries(services).reduce((acc, [key, service]) => {
        acc[key] = {
          ...service,
          status: healthStatus[key]?.status || 'unknown',
          responseTime: healthStatus[key]?.responseTime || 'N/A',
          lastChecked: new Date().toISOString(),
        };
        return acc;
      }, {} as any);

      return {
        services: servicesWithHealth,
        totalServices: Object.keys(services).length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get services information:', error);
      throw new HttpException('Failed to retrieve services information', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @All('auth/*')
  @ApiOperation({ summary: 'Proxy requests to Auth Service' })
  @ApiParam({ name: 'path', description: 'Auth service path' })
  async authProxy(@Req() req: Request, @Res() res: Response) {
    await this.proxyToService('auth', req, res);
  }

  @All('api/auth/*')
  @ApiOperation({ summary: 'Proxy requests to Auth Service API' })
  async authApiProxy(@Req() req: Request, @Res() res: Response) {
    await this.proxyToService('auth', req, res);
  }

  @All('courses/*')
  @ApiOperation({ summary: 'Proxy requests to Course Service' })
  @ApiParam({ name: 'path', description: 'Course service path' })
  async courseProxy(@Req() req: Request, @Res() res: Response) {
    await this.proxyToService('course', req, res);
  }

  @All('api/courses/*')
  @ApiOperation({ summary: 'Proxy requests to Course Service API' })
  async courseApiProxy(@Req() req: Request, @Res() res: Response) {
    await this.proxyToService('course', req, res);
  }

  @All('files/*')
  @ApiOperation({ summary: 'Proxy requests to Course Service (File endpoints)' })
  @ApiParam({ name: 'path', description: 'File service path' })
  async fileProxy(@Req() req: Request, @Res() res: Response) {
    await this.proxyToService('course', req, res);
  }

  @All('api/files/*')
  @ApiOperation({ summary: 'Proxy requests to Course Service API (File endpoints)' })
  async fileApiProxy(@Req() req: Request, @Res() res: Response) {
    await this.proxyToService('course', req, res);
  }

  @All('bot/*')
  @ApiOperation({ summary: 'Proxy requests to Bot Service' })
  @ApiParam({ name: 'path', description: 'Bot service path' })
  async botProxy(@Req() req: Request, @Res() res: Response) {
    await this.proxyToService('bot', req, res);
  }

  @All('api/bot/*')
  @ApiOperation({ summary: 'Proxy requests to Bot Service API' })
  async botApiProxy(@Req() req: Request, @Res() res: Response) {
    await this.proxyToService('bot', req, res);
  }

  @All('payment/*')
  @ApiOperation({ summary: 'Proxy requests to Payment Service' })
  @ApiParam({ name: 'path', description: 'Payment service path' })
  @UseGuards(GatewayAuthGuard) // Payment endpoints require authentication
  async paymentProxy(@Req() req: Request, @Res() res: Response) {
    if (!this.proxyService.isServiceAvailable('payment')) {
      throw new HttpException('Payment service is not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.proxyToService('payment', req, res);
  }

  @All('api/payment/*')
  @ApiOperation({ summary: 'Proxy requests to Payment Service API' })
  @UseGuards(GatewayAuthGuard)
  async paymentApiProxy(@Req() req: Request, @Res() res: Response) {
    if (!this.proxyService.isServiceAvailable('payment')) {
      throw new HttpException('Payment service is not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.proxyToService('payment', req, res);
  }

  @All('notifications/*')
  @ApiOperation({ summary: 'Proxy requests to Notification Service' })
  @ApiParam({ name: 'path', description: 'Notification service path' })
  @UseGuards(GatewayAuthGuard)
  async notificationProxy(@Req() req: Request, @Res() res: Response) {
    if (!this.proxyService.isServiceAvailable('notification')) {
      throw new HttpException('Notification service is not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.proxyToService('notification', req, res);
  }

  @All('api/notifications/*')
  @ApiOperation({ summary: 'Proxy requests to Notification Service API' })
  @UseGuards(GatewayAuthGuard)
  async notificationApiProxy(@Req() req: Request, @Res() res: Response) {
    if (!this.proxyService.isServiceAvailable('notification')) {
      throw new HttpException('Notification service is not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.proxyToService('notification', req, res);
  }

  @All('analytics/*')
  @ApiOperation({ summary: 'Proxy requests to Analytics Service' })
  @ApiParam({ name: 'path', description: 'Analytics service path' })
  @UseGuards(GatewayAuthGuard)
  async analyticsProxy(@Req() req: Request, @Res() res: Response) {
    if (!this.proxyService.isServiceAvailable('analytics')) {
      throw new HttpException('Analytics service is not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.proxyToService('analytics', req, res);
  }

  @All('api/analytics/*')
  @ApiOperation({ summary: 'Proxy requests to Analytics Service API' })
  @UseGuards(GatewayAuthGuard)
  async analyticsApiProxy(@Req() req: Request, @Res() res: Response) {
    if (!this.proxyService.isServiceAvailable('analytics')) {
      throw new HttpException('Analytics service is not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.proxyToService('analytics', req, res);
  }

  @All('plugins/*')
  @ApiOperation({ summary: 'Proxy requests to Plugin Service' })
  @ApiParam({ name: 'path', description: 'Plugin service path' })
  async pluginProxy(@Req() req: Request, @Res() res: Response) {
    if (!this.proxyService.isServiceAvailable('plugin')) {
      throw new HttpException('Plugin service is not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.proxyToService('plugin', req, res);
  }

  @All('api/plugins/*')
  @ApiOperation({ summary: 'Proxy requests to Plugin Service API' })
  async pluginApiProxy(@Req() req: Request, @Res() res: Response) {
    if (!this.proxyService.isServiceAvailable('plugin')) {
      throw new HttpException('Plugin service is not available', HttpStatus.SERVICE_UNAVAILABLE);
    }
    await this.proxyToService('plugin', req, res);
  }

  /**
   * Generic proxy method that handles the actual proxying logic
   */
  private async proxyToService(serviceName: string, req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Prepare proxy request
      const proxyRequest: ProxyRequest = {
        method: req.method,
        url: req.url,
        headers: this.prepareHeaders(req.headers, requestId),
        body: req.body,
        query: req.query as Record<string, any>,
      };

      this.logger.debug(`🚀 Proxying request ${requestId}`, {
        service: serviceName,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Proxy the request
      const response = await this.proxyService.proxyRequest(serviceName, proxyRequest);

      // Set response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add custom headers
      res.setHeader('X-Gateway-Request-ID', requestId);
      res.setHeader('X-Gateway-Service', serviceName);
      res.setHeader('X-Gateway-Time', `${Date.now() - startTime}ms`);

      // Send response
      res.status(response.status).json(response.data);

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Proxy success ${requestId}`, {
        service: serviceName,
        method: req.method,
        url: req.url,
        status: response.status,
        duration: `${duration}ms`,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`❌ Proxy failed ${requestId}`, {
        service: serviceName,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack,
      });

      // Send error response
      if (error instanceof HttpException) {
        const status = error.getStatus();
        const response = error.getResponse();
        
        res.status(status).json({
          error: typeof response === 'string' ? response : response,
          service: serviceName,
          requestId,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Internal gateway error',
          service: serviceName,
          requestId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  private prepareHeaders(reqHeaders: any, requestId: string): Record<string, string> {
    const headers: Record<string, string> = {};

    // Convert headers to string format
    Object.entries(reqHeaders).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        headers[key.toLowerCase()] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        headers[key.toLowerCase()] = value[0];
      }
    });

    // Add request tracking
    headers['x-request-id'] = requestId;
    headers['x-forwarded-by'] = 'gongbu-api-gateway';

    return headers;
  }

  private generateRequestId(): string {
    return `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
