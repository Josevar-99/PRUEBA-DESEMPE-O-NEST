import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenancesService } from './maintenances.service.js';
import { MaintenancesController } from './maintenances.controller.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { MechanicsModule } from '../mechanics/mechanics.module.js';
import { WorkshopsModule } from '../workshops/workshops.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance]),
    // Their services validate the existsnce and status of each related entity
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
  ],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
  // The API Key will reuse the history
  exports: [MaintenancesService],
})
export class MaintenancesModule {}