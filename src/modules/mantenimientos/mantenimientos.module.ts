import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mantenimiento } from './entities/mantenimiento.entity.js';
import { MantenimientosService } from './mantenimientos.service.js';
import { MantenimientosController } from './mantenimientos.controller.js';
import { VehiculosModule } from '../vehiculos/vehiculos.module.js';
import { MecanicosModule } from '../mecanicos/mecanicos.module.js';
import { TalleresModule } from '../talleres/talleres.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mantenimiento]),
    // Sus services validan existencia y estado de cada entidad relacionada
    VehiculosModule,
    MecanicosModule,
    TalleresModule,
  ],
  controllers: [MantenimientosController],
  providers: [MantenimientosService],
  // La API Key reutilizará el historial
  exports: [MantenimientosService],
})
export class MantenimientosModule {}