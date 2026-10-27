import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMecanicoDto } from './create-mecanico.dto.js';

/**
 * Se puede editar nombre, correo y especialidad. El usuario vinculado no cambia:
 * reasignarlo haría que los mantenimientos de un técnico aparezcan en la cuenta de otro.
 */
export class UpdateMecanicoDto extends PartialType(
  OmitType(CreateMecanicoDto, ['usuarioId'] as const),
) {}