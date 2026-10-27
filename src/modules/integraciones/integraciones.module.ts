import { Module } from '@nestjs/common';
import { IntegracionesController } from './integraciones.controller.js';
import { VehiculosModule } from '../vehiculos/vehiculos.module.js';
import { MantenimientosModule } from '../mantenimientos/mantenimientos.module.js';

@Module({
  // Solo expone datos de otros módulos; no tiene entidad propia
  imports: [VehiculosModule, MantenimientosModule],
  controllers: [IntegracionesController],
})
export class IntegracionesModule {}


