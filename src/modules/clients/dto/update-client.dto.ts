import { IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiPropertyOptional({
    description: 'Updated name of the client',
    example: 'Jane Doe'
  })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated email address',
    example: 'jane@example.com'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'New password (min 6 characters)',
    example: 'newSecurePassword456',
    minLength: 6
  })
  @IsOptional()
  @MinLength(6)
  password?: string;
}
