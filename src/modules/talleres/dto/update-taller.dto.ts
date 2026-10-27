import { PartialType } from '@nestjs/swagger';
import { CreateTallerDto } from './create-taller.dto.js';

/** Mismos campos y validaciones que al crear, todos opcionales. El estado no se edita aquí. */
export class UpdateTallerDto extends PartialType(CreateTallerDto) {}