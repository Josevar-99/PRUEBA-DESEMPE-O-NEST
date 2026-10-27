import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mecanico } from './entities/mecanico.entity.js';
import { MecanicosService } from './mecanicos.service.js';
import { MecanicosController } from './mecanicos.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  // UsersModule aporta UsersService para validar el usuario vinculado
  imports: [TypeOrmModule.forFeature([Mecanico]), UsersModule],
  controllers: [MecanicosController],
  providers: [MecanicosService],
  // MantenimientosService validará el mecánico y buscará el del técnico logueado
  exports: [MecanicosService],
})
export class MecanicosModule {}