import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum.js';

export class CreateUserDto {
  @IsEmail({}, { message: 'The email address must be valid' })
  @IsNotEmpty({ message: 'The email is required' })
  email: string;

  @IsString({ message: 'The password must be a string' })
  @MinLength(6, { message: 'The password must be at least 6 characters long' })
  // bcrypt ignores anything beyond 72 bytes; it is rejected to avoid silent truncation
  @MaxLength(72, { message: 'The password cannot exceed 72 characters' })
  password: string;

  @IsString({ message: 'The name must be a string' })
  @IsNotEmpty({ message: 'The name is required' })
  name: string;

  @IsEnum(Role, { message: 'The role must be ADMIN or TECHNICIAN' })
  role: Role;
}