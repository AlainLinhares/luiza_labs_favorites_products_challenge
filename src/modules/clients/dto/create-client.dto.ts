import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    description: 'Full name of the client',
    example: 'John Doe'
  })
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Unique email address of the client',
    example: 'john@example.com'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password for the client account (min 6 characters)',
    example: 'securePassword123',
    minLength: 6
  })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
