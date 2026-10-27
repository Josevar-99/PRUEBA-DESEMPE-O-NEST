import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Taller } from './entities/taller.entity.js';
import { TalleresService } from './talleres.service.js';
import { TalleresController } from './talleres.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Taller])],
  controllers: [TalleresController],
  providers: [TalleresService],
  // Se exporta porque MantenimientosService validará que el taller exista y esté activo
  exports: [TalleresService],
})
export class TalleresModule {}