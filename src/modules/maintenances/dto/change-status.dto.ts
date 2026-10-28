import { Transform,Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { MaintenanceStatus } from '../../../common/enums/maintenance-status.enum.js';

/**
 * A single endpoint for all status changes (requirement 5.7).
 * The 4 closing fields are only required when transitioning to COMPLETED (requirement 5.9);
 * ValidateIf makes the ValidationPipe enforce them only in that case.
 */
export class ChangeStatusDto {
  @IsEnum(MaintenanceStatus, {
    message: 'status must be SCHEDULED, IN_PROGRESS, COMPLETED or CANCELLED',
  })
  status: MaintenanceStatus;

   @ValidateIf((o: ChangeStatusDto) => o.status === MaintenanceStatus.COMPLETED)
  // trim before validating: "   " becomes "" and @IsNotEmpty rejects it
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'workPerformed is required to complete the maintenance' })
  @MaxLength(2000)
  workPerformed?: string;

  @ValidateIf((o: ChangeStatusDto) => o.status === MaintenanceStatus.COMPLETED)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'finalCost is required to complete the maintenance (max. 2 decimal places)' },
  )
  @Min(0, { message: 'finalCost cannot be negative' })
  finalCost?: number;

  @ValidateIf((o: ChangeStatusDto) => o.status === MaintenanceStatus.COMPLETED)
  @Type(() => Date)
  @IsDate({ message: 'completedAt is required to complete the maintenance' })
  completedAt?: Date;

  @ValidateIf((o: ChangeStatusDto) => o.status === MaintenanceStatus.COMPLETED)
  @IsInt({ message: 'finalMileage is required to complete the maintenance' })
  @Min(0)
  finalMileage?: number;
}