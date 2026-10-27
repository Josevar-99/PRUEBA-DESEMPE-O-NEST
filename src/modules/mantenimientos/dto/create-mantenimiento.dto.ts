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
import { TipoMantenimiento } from '../../../common/enums/tipo-mantenimiento.enum.js';

/** El estado no se recibe: todo mantenimiento nace SCHEDULED (requisito 5.5) */
export class CreateMantenimientoDto {
  @IsEnum(TipoMantenimiento, { message: 'tipo debe ser PREVENTIVE o CORRECTIVE' })
  tipo: TipoMantenimiento;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(1000)
  descripcion: string;

  @IsInt({ message: 'El kilometraje debe ser un número entero' })
  @Min(0)
  kilometraje: number;

  // Se recibe en ISO 8601, ej: "2026-11-03T07:30:00-05:00"
  @Type(() => Date)
  @IsDate({ message: 'fechaProgramada debe ser una fecha válida' })
  fechaProgramada: Date;

  @Type(() => Date)
  @IsDate({ message: 'fechaFinEstimada debe ser una fecha válida' })
  fechaFinEstimada: Date;

  @IsUUID('4', { message: 'vehiculoId debe ser un UUID válido' })
  vehiculoId: string;

  @IsUUID('4', { message: 'mecanicoId debe ser un UUID válido' })
  mecanicoId: string;

  @IsUUID('4', { message: 'tallerId debe ser un UUID válido' })
  tallerId: string;
}