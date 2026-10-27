import { Type } from 'class-transformer';
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
import { EstadoMantenimiento } from '../../../common/enums/estado-mantenimiento.enum.js';

/**
 * Un solo endpoint para todos los cambios de estado (requisito 5.7).
 * Los 4 campos de cierre solo son obligatorios al pasar a COMPLETED (requisito 5.9);
 * ValidateIf hace que el ValidationPipe los exija solo en ese caso.
 */
export class CambiarEstadoDto {
  @IsEnum(EstadoMantenimiento, {
    message: 'estado debe ser SCHEDULED, IN_PROGRESS, COMPLETED o CANCELLED',
  })
  estado: EstadoMantenimiento;

  @ValidateIf((o: CambiarEstadoDto) => o.estado === EstadoMantenimiento.COMPLETED)
  @IsString()
  @IsNotEmpty({ message: 'trabajoRealizado es obligatorio para completar' })
  @MaxLength(2000)
  trabajoRealizado?: string;

  @ValidateIf((o: CambiarEstadoDto) => o.estado === EstadoMantenimiento.COMPLETED)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'costoFinal es obligatorio para completar (máx. 2 decimales)' },
  )
  @Min(0, { message: 'costoFinal no puede ser negativo' })
  costoFinal?: number;

  @ValidateIf((o: CambiarEstadoDto) => o.estado === EstadoMantenimiento.COMPLETED)
  @Type(() => Date)
  @IsDate({ message: 'fechaFinalizacion es obligatoria para completar' })
  fechaFinalizacion?: Date;

  @ValidateIf((o: CambiarEstadoDto) => o.estado === EstadoMantenimiento.COMPLETED)
  @IsInt({ message: 'kilometrajeFinal es obligatorio para completar' })
  @Min(0)
  kilometrajeFinal?: number;
}