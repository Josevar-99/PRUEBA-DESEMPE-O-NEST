import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { User } from '../src/modules/users/entities/user.entity.js';

/**
 * 💡 [ADAPT FOR THE TEST - END-TO-END (E2E) TESTS WITH JEST]:
 *
 * This file demonstrates how to validate the entire application pipeline:
 * 1. Middleware: Verification of the `x-request-id` header.
 * 2. Interceptor: Verification of the `ResponseInterceptor` structure ({ success, statusCode, data, timestamp }).
 * 3. Guard: Verification that protected routes return `401 Unauthorized` if no Bearer token is provided.
 * 4. Filter + ValidationPipe: Verification that requests with an invalid DTO return a formatted `400 Bad Request`.
 *
 * 💡 HOW TO ADD TESTS FOR YOUR NEW ENDPOINTS:
 * - To simulate authenticated requests:
 *   `.set('Authorization', 'Bearer ' + validToken)`
 * - To override new repositories:
 *   `.overrideProvider(getRepositoryToken(YourNewEntity)).useValue(mockRepo)`
 */
describe('App Endpoints & Architecture (e2e)', () => {
  let app: INestApplication;

  // Mock of the TypeORM repository so that tests pass without requiring a physical database to be running
  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((entity) =>
        Promise.resolve({ id: 'mock-uuid', ...entity }),
      ),
    remove: jest.fn().mockResolvedValue(true),
  };

  const mockDataSource = {
    isInitialized: true,
    destroy: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    getRepository: jest.fn().mockReturnValue(mockUserRepository),
    entityMetadatas: [],
    options: { type: 'postgres' },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(mockDataSource)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();

    // Replicate the same global configuration as main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Middleware & Interceptors', () => {
    it('should respond with x-request-id header and ResponseInterceptor envelope format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      // Verification of LoggerMiddleware (x-request-id)
      expect(response.headers['x-request-id']).toBeDefined();

      // Verification of ResponseInterceptor ({ success, statusCode, timestamp, data })
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('database', 'connected');
    });
  });

  describe('Guards', () => {
    it('should reject with 401 Unauthorized when accessing a protected route without a token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/vehicles')
        .expect(401);

      // Verification of AllExceptionsFilter ({ success, statusCode, message, path })
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Validation & Filters', () => {
    it('should return 400 Bad Request with validation details when sending an invalid payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: '123', // Too short
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('errors');
    });
  });
});