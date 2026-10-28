import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { MaintenanceType } from '../../../common/enums/maintenance-type.enum.js';

/** The status is not received: every maintenance is born SCHEDULED (requirement 5.5) */
export class CreateMaintenanceDto {
  @IsEnum(MaintenanceType, { message: 'type must be PREVENTIVE or CORRECTIVE' })
  type: MaintenanceType;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(1000)
  description: string;

  @IsInt({ message: 'Mileage must be an integer' })
  @Min(0)
  mileage: number;

  // Received in ISO 8601, e.g.: "2026-11-03T07:30:00-05:00"
  @Type(() => Date)
  @IsDate({ message: 'scheduledAt must be a valid date' })
  scheduledAt: Date;

  @Type(() => Date)
  @IsDate({ message: 'estimatedEndAt must be a valid date' })
  estimatedEndAt: Date;

  @IsUUID('4', { message: 'vehicleId must be a valid UUID' })
  vehicleId: string;

  @IsUUID('4', { message: 'mechanicId must be a valid UUID' })
  mechanicId: string;

  @IsUUID('4', { message: 'workshopId must be a valid UUID' })
  workshopId: string;
}