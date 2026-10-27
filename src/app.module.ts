import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { validateEnv } from './config/env.schema.js';
import { typeOrmAsyncConfig } from './config/typeorm.config.js';

import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { TalleresModule } from './modules/talleres/talleres.module.js';
import { VehiculosModule } from './modules/vehiculos/vehiculos.module.js';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - MÓDULO PRINCIPAL]:
 *
 * 💡 CÓMO AGREGAR NUEVOS MÓDULOS DE TU PRUEBA:
 * 1. Genera o crea tu nuevo módulo (ej: ProductosModule, OrdenesModule):
 *    `nest g res modules/productos --no-spec`
 * 2. Impórtalo en el array `imports: [...]` de este archivo.
 *
 * 💡 CICLO DE VIDA GLOBAL CONFIGURADO:
 * 1. ConfigModule + validateEnv: Valida el archivo .env con Zod al arrancar.
 * 2. TypeOrmModule: Conexión con PostgreSQL gestionada en src/config/typeorm.config.ts.
 * 3. AllExceptionsFilter: Formatea todos los errores HTTP y de base de datos.
 * 4. ResponseInterceptor: Estandariza respuestas exitosas { success, statusCode, data, timestamp }.
 * 5. LoggingInterceptor: Mide tiempos de respuesta en consola.
 * 6. JwtAuthGuard: Protege todas las rutas (salvo @Public()).
 * 7. RolesGuard: Aplica restricciones de rol con @Roles(...).
 * 8. LoggerMiddleware: Imprime logs HTTP y propaga x-request-id en toda la app.
 */
@Module({
  imports: [
    // 1. Configuración de variables de entorno y validación con Zod
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    // 2. Conexión a Base de Datos PostgreSQL con TypeORM
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),

    // 3. Módulos funcionales de la aplicación
    UsersModule,
    AuthModule,
    HealthModule,
    TalleresModule,
    VehiculosModule,

    // 💡 [AGREGAR AQUÍ TUS NUEVOS MÓDULOS]:
    // ProductsModule,
    // OrdersModule,
    // CategoriesModule,
  ],
  providers: [
    // Exception Filter global: captura errores HTTP y de BD (TypeORM)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Interceptor global: formato unificado de respuestas exitosas
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Interceptor de rendimiento: auditoría de tiempos de ejecución
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Guard global de autenticación: rutas privadas por defecto (usar @Public() para eximir)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Guard global de autorización: verifica @Roles(Role.ADMIN, ...)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configuración de Middlewares globales
   */
  configure(consumer: MiddlewareConsumer): void {
    // Aplica el LoggerMiddleware con x-request-id a todas las rutas
    consumer.apply(LoggerMiddleware).forRoutes('*');

    // 💡 Si necesitas excluir rutas del middleware:
    // consumer.apply(LoggerMiddleware).exclude('health').forRoutes('*');
  }
}
