import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity.js';
import { VehiculosService } from './vehiculos.service.js';
import { VehiculosController } from './vehiculos.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo])],
  controllers: [VehiculosController],
  providers: [VehiculosService],
  // MantenimientosService lo usará para validar el vehículo y cambiar su estado
  exports: [VehiculosService],
})
export class VehiculosModule {}