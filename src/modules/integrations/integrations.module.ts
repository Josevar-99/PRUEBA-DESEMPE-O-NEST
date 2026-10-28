import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { MaintenancesModule } from '../maintenances/maintenances.module.js';

@Module({
  // Only exposes data from other modules; it has no entity of its own
  imports: [VehiclesModule, MaintenancesModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
