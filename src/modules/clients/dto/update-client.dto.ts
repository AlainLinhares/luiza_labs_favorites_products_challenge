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
}
