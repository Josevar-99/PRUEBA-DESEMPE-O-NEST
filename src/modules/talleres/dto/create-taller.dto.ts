import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** El estado no se recibe: todo taller nace ACTIVE */
export class CreateTallerDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  nombre: string;

  @IsString({ message: 'La dirección debe ser texto' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @MaxLength(200, { message: 'La dirección no puede superar 200 caracteres' })
  direccion: string;
}