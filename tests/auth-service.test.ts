import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../services/auth-service/src/app.module';

describe('Auth Service (e2e)', () => {
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
    it('/api/v1/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('info');
          expect(res.body).toHaveProperty('details');
        });
    });

    it('/api/v1/health/ready (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ready');
        });
    });

    it('/api/v1/health/live (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'alive');
        });
    });
  });

  describe('Authentication Endpoints', () => {
    it('/api/v1/auth/telegram (POST) - should validate telegram auth data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/telegram')
        .send({
          initData: 'invalid_data'
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('/api/v1/auth/refresh (POST) - should validate refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid_token'
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('/api/v1/auth/logout (POST) - should require authorization', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  describe('User Endpoints', () => {
    it('/api/v1/users/profile (GET) - should require authorization', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .expect(401);
    });

    it('/api/v1/users/profile (PUT) - should require authorization', () => {
      return request(app.getHttpServer())
        .put('/api/v1/users/profile')
        .send({
          username: 'testuser'
        })
        .expect(401);
    });
  });

  describe('Validation', () => {
    it('should validate request body', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/telegram')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });
  });
});
