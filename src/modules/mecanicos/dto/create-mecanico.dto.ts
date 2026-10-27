import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/** El estado no se recibe: todo mecánico nace ACTIVE */
export class CreateMecanicoDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100)
  nombre: string;

  // En minúsculas para que el UNIQUE no deje pasar "Juan@x.com" y "juan@x.com"
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El correo debe ser válido' })
  correo: string;

  @IsString({ message: 'La especialidad debe ser texto' })
  @IsNotEmpty({ message: 'La especialidad es obligatoria' })
  @MaxLength(100)
  especialidad: string;

  @IsUUID('4', { message: 'usuarioId debe ser un UUID válido' })
  usuarioId: string;
}