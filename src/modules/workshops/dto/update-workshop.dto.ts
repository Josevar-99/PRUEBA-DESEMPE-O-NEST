import { PartialType } from '@nestjs/swagger';
import { CreateWorkshopDto } from './create-workshop.dto.js';

/** Same fields and validations as on create, all optional. The status is not edited here. */
export class UpdateWorkshopDto extends PartialType(CreateWorkshopDto) {}