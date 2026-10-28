import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto.js';

/**
 * Name, brand, model, year and mileage can be edited. The linked status is not changed here:
 * AVAILABLE and IN_MAINTENANCE are managed by maintenances,
 * and INACTIVE by the deactivate route. If the admin could set it
 * manually, it would get out of sync with the actual maintenances.
 */
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}