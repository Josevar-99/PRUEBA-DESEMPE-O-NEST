import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum.js';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - DTO CON CLASS-VALIDATOR]:
 * Define aquí los campos requeridos para crear el recurso.
 * La validación se ejecuta automáticamente gracias al ValidationPipe configurado en main.ts.
 *
 * 💡 DECORADORES ÚTILES EN PRUEBAS:
 * - @IsNumber() / @IsPositive() para precios y cantidades.
 * - @IsDateString() para fechas en formato ISO (YYYY-MM-DD).
 * - @IsUUID() para validar identificadores foráneos.
 * - @ArrayMinSize(1) para arrays no vacíos.
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;


  @IsEnum(Role, { message: 'El rol debe ser ADMIN o TECHNICIAN' })
  role: Role ;

  // 💡 Ejemplo para agregar un nuevo campo:
  // @IsOptional()
  // @IsPhoneNumber('CO', { message: 'Número de teléfono inválido' })
  // phone?: string;
}
