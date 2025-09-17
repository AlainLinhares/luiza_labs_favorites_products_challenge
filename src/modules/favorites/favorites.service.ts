import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { ProductsService } from '../products/products.service';
import { Favorite } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FavoritesService {
  private logger = new Logger(FavoritesService.name);
  private mockFavorites: {
    id: string;
    clientId: string;
    productId: string;
    createdAt: Date;
  }[] = [];

  constructor(private prisma: PrismaService, private productsService: ProductsService) {
    const filePath = path.resolve(__dirname, '../../../src/mocks/mock-favorites.json');
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      this.mockFavorites = JSON.parse(fileContent).map((f: any) => ({
        ...f,
        createdAt: new Date(f.createdAt),
      }));
      this.logger.log(`Loaded ${this.mockFavorites.length} mock favorites`);
    } catch (err) {
      this.logger.error('Failed to load mock favorites:', err);
      this.mockFavorites = [];
    }
  }

  async add(clientId: string, dto: AddFavoriteDto) {
    const product = await this.productsService.findById(dto.productId);
    if (!product) {
      throw new BadRequestException('Product does not exist');
    }

    try {
      return await this.prisma.favorite.create({
        data: {
          clientId,
          productId: dto.productId,
        },
      });
    } catch (e: any) {
      this.logger.error('Failed to add favorite:', e.message || e);
      throw new BadRequestException('Product already in favorites or invalid client');
    }
  }

  async list(clientId: string) {
    try {
      const dbFavorites = await this.prisma.favorite.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });

      const sourceFavorites = dbFavorites.length > 0
        ? dbFavorites
        : this.mockFavorites.filter(f => f.clientId === clientId);

      const favoriteProducts = await Promise.all(
        sourceFavorites.map(async (f: Favorite) => {
          const product = await this.productsService.findById(f.productId).catch(() => null);
          return {
            productId: f.productId,
            addedAt: f.createdAt,
            ...(product ? {
              title: product.title,
              image: product.image,
              price: product.price,
              reviewScore: product.reviewScore ?? product.review,
            } : {}),
          };
        })
      );

      return favoriteProducts;
    } catch (error) {
      this.logger.error('Error listing favorites:', error);
      return [];
    }
  }

  async remove(clientId: string, productId: string) {
    const deleted = await this.prisma.favorite.deleteMany({
      where: { clientId, productId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Favorite not found');
    }

    return { removed: true };
  }
}
