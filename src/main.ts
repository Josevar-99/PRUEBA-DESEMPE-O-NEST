import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { setupSwagger } from './config/swagger.config.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Values already validated by Zod at startup (env.schema.ts)
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') ?? 'api';

  app.enableCors();
  app.setGlobalPrefix(apiPrefix);

  // Global DTO validation with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // discards properties not present in the DTO
      forbidNonWhitelisted: true, // and responds with 400 if they are sent
      transform: true, // converts the body to the DTO class (required for @Transform and @Type)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  setupSwagger(app);

  // Cleanly closes DB connections when the app is stopped
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`Server running at: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger documentation at: http://localhost:${port}/docs`);
}

bootstrap();
