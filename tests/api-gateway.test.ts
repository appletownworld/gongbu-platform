import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../services/api-gateway/src/app.module';

describe('API Gateway (e2e)', () => {
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

  describe('Health Endpoints', () => {
    it('/v1/health/live (GET)', () => {
      return request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'alive');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });

    it('/v1/health/ready (GET)', () => {
      return request(app.getHttpServer())
        .get('/v1/health/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ready');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('/v1/health/metrics (GET)', () => {
      return request(app.getHttpServer())
        .get('/v1/health/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('memory');
          expect(res.body).toHaveProperty('process');
        });
    });
  });

  describe('Services Endpoint', () => {
    it('/v1/services (GET)', () => {
      return request(app.getHttpServer())
        .get('/v1/services')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('services');
          expect(res.body).toHaveProperty('totalServices');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('API Documentation', () => {
    it('/api (GET)', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', () => {
      return request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.headers).toHaveProperty('access-control-allow-origin');
        });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', () => {
      return request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.headers).toHaveProperty('x-frame-options');
          expect(res.headers).toHaveProperty('x-content-type-options');
          expect(res.headers).toHaveProperty('x-xss-protection');
        });
    });
  });
});
