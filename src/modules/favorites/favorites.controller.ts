import { Controller, Post, Body, Param, Get, Delete, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('clients/:clientId/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private service: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a favorite product for a client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiBody({ type: AddFavoriteDto })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  async add(@Param('clientId') clientId: string, @Body() dto: AddFavoriteDto) {
    return this.service.add(clientId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all favorite products for a client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'List of favorite products' })
  async list(@Param('clientId') clientId: string) {
    return this.service.list(clientId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a favorite product for a client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiParam({ name: 'productId', description: 'Product ID to remove from favorites' })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  async remove(@Param('clientId') clientId: string, @Param('productId') productId: string) {
    return this.service.remove(clientId, productId);
  }
}
