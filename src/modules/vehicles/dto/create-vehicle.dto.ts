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

/** The status is not received: every vehicle is born AVAILABLE */
export class CreateVehicleDto {
  // Normalized to uppercase before validation, so "abc123" and "ABC123"
  // are treated as the same plate and the DB UNIQUE constraint works correctly
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9]{5,8}$/, {
    message: 'The plate must have between 5 and 8 letters or numbers, with no spaces or hyphens',
  })
  plate: string;

  @IsString({ message: 'The brand must be text' })
  @IsNotEmpty({ message: 'The brand is required' })
  @MaxLength(50)
  make: string;

  @IsString({ message: 'The model must be text' })
  @IsNotEmpty({ message: 'The model is required' })
  @MaxLength(50)
  model: string;

  @IsInt({ message: 'The year must be an integer' })
  @Min(1950, { message: 'The year cannot be less than 1950' })
  @Max(new Date().getFullYear() + 1, { message: 'The year cannot be in the future' })
  year: number;

  @IsInt({ message: 'The mileage must be an integer' })
  @Min(0, { message: 'The mileage cannot be negative' })
  mileage: number;
}