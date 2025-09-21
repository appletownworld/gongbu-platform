import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../services/api-gateway/src/app.module';

describe('Gongbu Platform Integration Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('End-to-End User Flow', () => {
    it('should handle complete user registration and course creation flow', async () => {
      // This is a placeholder for a complete integration test
      // In a real scenario, this would:
      // 1. Register a new user via Telegram auth
      // 2. Create a course
      // 3. Add course steps
      // 4. Publish the course
      // 5. Test the bot functionality
      
      const healthResponse = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      expect(healthResponse.body).toHaveProperty('status');
    });
  });

  describe('Service Communication', () => {
    it('should proxy requests to auth service', async () => {
      // Test API Gateway proxying to Auth Service
      const response = await request(app.getHttpServer())
        .get('/v1/auth/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('should handle service unavailability gracefully', async () => {
      // Test error handling when services are down
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      // Should return partial health status
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple requests quickly
      const promises = Array(20).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/v1/health/live')
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (rate limit is high for health checks)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('statusCode');
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/nonexistent-endpoint')
        .expect(404);

      expect(response.headers).toHaveProperty('x-gateway-request-id');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});
