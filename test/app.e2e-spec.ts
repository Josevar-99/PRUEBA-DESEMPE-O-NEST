import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { User } from '../src/modules/users/entities/user.entity.js';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - PRUEBAS END-TO-END (E2E) CON JEST]:
 *
 * Este archivo demuestra cómo validar todo el pipeline de la aplicación:
 * 1. Middleware: Verificación del header `x-request-id`.
 * 2. Interceptor: Verificación de la estructura `ResponseInterceptor` ({ success, statusCode, data, timestamp }).
 * 3. Guard: Verificación de que rutas protegidas devuelven `401 Unauthorized` si no hay token Bearer.
 * 4. Filter + ValidationPipe: Verificación de que peticiones con DTO inválido devuelven `400 Bad Request` formateado.
 *
 * 💡 CÓMO AGREGAR PRUEBAS PARA TUS NUEVOS ENDPOINTS:
 * - Para simular peticiones autenticadas:
 *   `.set('Authorization', 'Bearer ' + tokenValido)`
 * - Para override de nuevos repositorios:
 *   `.overrideProvider(getRepositoryToken(TuNuevaEntidad)).useValue(mockRepo)`
 */
describe('App Endpoints & Architecture (e2e)', () => {
  let app: INestApplication;

  // Mock del repositorio TypeORM para que las pruebas pasen sin requerir base de datos física levantada
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

    // Replicar configuración global idéntica a main.ts
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
    it('debe responder con header x-request-id y formato envelope de ResponseInterceptor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      // Verificación de LoggerMiddleware (x-request-id)
      expect(response.headers['x-request-id']).toBeDefined();

      // Verificación de ResponseInterceptor ({ success, statusCode, timestamp, data })
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('database', 'connected');
    });
  });

  describe('Guards', () => {
    it('debe rechazar con 401 Unauthorized al acceder a una ruta protegida sin token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);

      // Verificación de AllExceptionsFilter ({ success, statusCode, message, path })
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Validation & Filters', () => {
    it('debe retornar 400 Bad Request con detalles de validación al enviar payload inválido', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: '123', // Demasiado corta
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('errors');
    });
  });
});
