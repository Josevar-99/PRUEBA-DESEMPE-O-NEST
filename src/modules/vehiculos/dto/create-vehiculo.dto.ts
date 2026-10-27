import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** El estado no se recibe: todo vehículo nace AVAILABLE */
export class CreateVehiculoDto {
  // Se normaliza a mayúsculas antes de validar, para que "abc123" y "ABC123"
  // sean la misma placa y el UNIQUE de la BD funcione de verdad
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9]{5,8}$/, {
    message: 'La placa debe tener entre 5 y 8 letras o números, sin espacios ni guiones',
  })
  placa: string;

  @IsString({ message: 'La marca debe ser texto' })
  @IsNotEmpty({ message: 'La marca es obligatoria' })
  @MaxLength(50)
  marca: string;

  @IsString({ message: 'El modelo debe ser texto' })
  @IsNotEmpty({ message: 'El modelo es obligatorio' })
  @MaxLength(50)
  modelo: string;

  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(1950, { message: 'El año no puede ser menor a 1950' })
  @Max(new Date().getFullYear() + 1, { message: 'El año no puede ser futuro' })
  anio: number;

  @IsInt({ message: 'El kilometraje debe ser un número entero' })
  @Min(0, { message: 'El kilometraje no puede ser negativo' })
  kilometraje: number;
}