import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - BOOTSTRAP DE LA APLICACIÓN]:
 *
 * 💡 CONFIGURACIONES COMUNES EN PRUEBAS:
 * 1. Prefijo global: cambiar `api` por `api/v1` si el enunciado lo solicita.
 * 2. Validación DTO: `whitelist: true` descarta campos no decorados en el DTO.
 *    `forbidNonWhitelisted: true` lanza error 400 si envían propiedades desconocidas.
 * 3. Swagger: modifícalo según el nombre de tu proyecto para ganar puntos en presentación.
 * 4. CORS: restringir orígenes permitidos si se exige en los requerimientos.
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api';

  // Habilitar CORS para peticiones desde frontend o evaluadores externos
  app.enableCors();

  // Prefijo global de rutas (ej: http://localhost:3000/api/...)
  app.setGlobalPrefix(apiPrefix);

  // Validación global estricta con class-validator / class-transformer
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve del body cualquier propiedad que no esté en el DTO
      forbidNonWhitelisted: true, // Lanza 400 Bad Request si envían propiedades extra
      transform: true, // Convierte tipos automáticamente (string a number/boolean)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Documentación OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Base - Prueba de Desempeño')
    .setDescription(
      'Documentación OpenAPI de la plantilla con Middlewares, Guards, Interceptors, Filters, TypeORM, Zod y Class-Validator',
    )
    .setVersion('1.0.0')
    .addBearerAuth() // Permite probar endpoints con el botón "Authorize" introduciendo el token JWT
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Cierre limpio de conexiones y pools de base de datos
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(
    `🚀 Servidor ejecutándose en: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(
    `📚 Documentación Swagger disponible en: http://localhost:${port}/docs`,
  );
}

bootstrap();
