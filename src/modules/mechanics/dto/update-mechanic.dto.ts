import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMechanicDto } from './create-mechanic.dto.js';

/**
 * Name, email and specialty can be edited. The linked user cannot change:
 * reassigning it would cause one technician's maintenances to appear in another's account.
 */
export class UpdateMechanicDto extends PartialType(
  OmitType(CreateMechanicDto, ['userId'] as const),
) {}