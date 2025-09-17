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
}
