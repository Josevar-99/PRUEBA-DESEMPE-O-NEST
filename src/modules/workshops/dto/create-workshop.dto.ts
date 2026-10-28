import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** The status is not received: every workshop is born ACTIVE */
export class CreateWorkshopDto {
  @IsString({ message: 'The name must be text' })
  @IsNotEmpty({ message: 'The name is required' })
  @MaxLength(100, { message: 'The name cannot exceed 100 characters' })
  name: string;

  @IsString({ message: 'The address must be text' })
  @IsNotEmpty({ message: 'The address is required' })
  @MaxLength(200, { message: 'The address cannot exceed 200 characters' })
  address: string;
}