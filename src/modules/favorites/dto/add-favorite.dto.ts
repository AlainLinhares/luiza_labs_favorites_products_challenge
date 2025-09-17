import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFavoriteDto {
  @ApiProperty({
    description: 'Unique identifier of the product to be favorited',
    example: '12345-product-id'
  })
  @IsNotEmpty()
  productId!: string;
}
