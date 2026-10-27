import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

/**
 * Todos los campos de CreateUserDto pasan a ser opcionales, con sus mismas
 * validaciones (incluido el MaxLength(72) de bcrypt), más isActive.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser true o false' })
  isActive?: boolean;
}