import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { User } from './entities/user.entity.js';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - MÓDULO DE RECURSO]:
 * Cada vez que crees una nueva entidad para tu prueba:
 * 1. Regístrala en `imports: [TypeOrmModule.forFeature([TuEntidad])]`.
 * 2. Si otro módulo necesita consultar TuEntidad/TuServicio (ej: AuthModule o ReportsModule),
 *    agrégalo en `exports: [TuServicio, TypeOrmModule]`.
 * 3. Importa este módulo en `src/app.module.ts`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
