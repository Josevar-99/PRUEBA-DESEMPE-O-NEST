import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { MaintenancesService } from '../maintenances/maintenances.service.js';

/**
 * Endpoints for external systems. @Public() exempts from the global JWT and
 * ApiKeyGuard requires the key instead: an external system does not have a login.
 */
@ApiTags('integrations')
@ApiSecurity('x-api-key')
@Public()
@UseGuards(ApiKeyGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly maintenancesService: MaintenancesService,
  ) {}

  /**
   * Returns a summary, not the internal entities: an external system does not need
   * timestamps, user ids or emails. The vehicle appears only once at the top.
   */
  @Get('vehicles/:plate/history')
  @ApiOperation({ summary: 'Vehicle summary and its completed maintenance history (x-api-key)' })
  async historyByPlate(@Param('plate') plate: string) {
    // findByPlate responds 404 if the plate does not exist
    const vehicle = await this.vehiclesService.findByPlate(plate);
    const history = await this.maintenancesService.vehicleHistory(vehicle.id);

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        make: vehicle.make,
        model: vehicle.model,
        available: vehicle.status === VehicleStatus.AVAILABLE,
      },
      maintenances: history.map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        description: m.description,
        workPerformed: m.workPerformed,
        mileage: m.mileage,
        finalMileage: m.finalMileage,
        cost: m.finalCost,
        completedAt: m.completedAt,
        mechanic: { id: m.mechanic.id, name: m.mechanic.name },
        workshop: { id: m.workshop.id, name: m.workshop.name },
      })),
    };
  }
}