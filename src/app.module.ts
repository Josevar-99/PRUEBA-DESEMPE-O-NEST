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
import { WorkshopsModule } from './modules/workshops/workshops.module.js';
import { VehiclesModule } from './modules/vehicles/vehicles.module.js';
import { MechanicsModule } from './modules/mechanics/mechanics.module.js';
import { MaintenancesModule } from './modules/maintenances/maintenances.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { AuditsModule } from './modules/audits/audits.module.js';
import { AuditInterceptor } from './modules/audits/audit.interceptor.js';

/**
 * 💡 [ADAPT FOR THE TEST - MAIN MODULE]:
 *
 * 💡 HOW TO ADD NEW MODULES FOR YOUR TEST:
 * 1. Generate or create your new module (e.g.: ProductsModule, OrdersModule):
 *    `nest g res modules/products --no-spec`
 * 2. Import it in the `imports: [...]` array of this file.
 *
 * 💡 GLOBAL LIFECYCLE CONFIGURED:
 * 1. ConfigModule + validateEnv: Validates the .env file with Zod at startup.
 * 2. TypeOrmModule: PostgreSQL connection managed in src/config/typeorm.config.ts.
 * 3. AllExceptionsFilter: Formats all HTTP and database errors.
 * 4. ResponseInterceptor: Standardizes successful responses { success, statusCode, data, timestamp }.
 * 5. LoggingInterceptor: Measures response times in the console.
 * 6. JwtAuthGuard: Protects all routes (except @Public()).
 * 7. RolesGuard: Applies role restrictions with @Roles(...).
 * 8. LoggerMiddleware: Prints HTTP logs and propagates x-request-id throughout the app.
 */
@Module({
  imports: [
    // 1. Environment variable configuration and validation with Zod
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    // 2. PostgreSQL Database connection with TypeORM
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),

    // 3. Application functional modules
    UsersModule,
    AuthModule,
    HealthModule,
    WorkshopsModule,
    VehiclesModule,
    MechanicsModule,
    MaintenancesModule,
    IntegrationsModule,
    AuditsModule,

    // 💡 [ADD YOUR NEW MODULES HERE]:
    // ProductsModule,
    // OrdersModule,
    // CategoriesModule,
  ],
  providers: [
    // Global Exception Filter: catches HTTP and DB (TypeORM) errors
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global Interceptor: unified format for successful responses
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Performance Interceptor: execution time auditing
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Audit: runs after ResponseInterceptor to receive unwrapped data
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // Global authentication guard: routes are private by default (use @Public() to exempt)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global authorization guard: enforces @Roles(Role.ADMIN, ...)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Global Middleware configuration
   */
  configure(consumer: MiddlewareConsumer): void {
    // Applies LoggerMiddleware with x-request-id to all routes
    consumer.apply(LoggerMiddleware).forRoutes('*path');

    // 💡 If you need to exclude routes from the middleware:
    // consumer.apply(LoggerMiddleware).exclude('health').forRoutes('*');
  }
}
