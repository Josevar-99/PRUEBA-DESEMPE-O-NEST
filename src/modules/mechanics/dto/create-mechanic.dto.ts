import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/** The status is not received: every mechanic is born ACTIVE */
export class CreateMechanicDto {
  @IsString({ message: 'The name must be text' })
  @IsNotEmpty({ message: 'The name is required' })
  @MaxLength(100)
  name: string;

  // Lowercased so the UNIQUE constraint does not allow "Juan@x.com" and "juan@x.com" through
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'The email must be valid' })
  email: string;

  @IsString({ message: 'The specialty must be text' })
  @IsNotEmpty({ message: 'The specialty is required' })
  @MaxLength(100)
  specialty: string;

  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId: string;
}