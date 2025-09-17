import { FavoritesService } from '../../src/modules/favorites/favorites.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: PrismaService;
  let productsService: any;

  beforeEach(() => {
    prisma = new PrismaService();
    productsService = { findById: jest.fn() };
    service = new FavoritesService(prisma, productsService);
  });

  it('adds a favorite successfully when product exists', async () => {
    const mockFavorite = { id: 'f1', clientId: 'c1', productId: '123', createdAt: new Date() };

    jest.spyOn(productsService, 'findById').mockResolvedValue({ id: '123', title: 'P' });
    jest.spyOn(prisma.favorite, 'create').mockResolvedValue(mockFavorite);

    const res = await service.add('c1', { productId: '123' });

    expect(res.productId).toBe('123');
    expect(prisma.favorite.create).toHaveBeenCalled();
  });

  it('rejects when product not found', async () => {
    jest.spyOn(productsService, 'findById').mockResolvedValue(null);

    await expect(service.add('c1', { productId: '999' })).rejects.toThrow(BadRequestException);
  });

  it('lists favorites enriched with product data', async () => {
    const mockFavorite = {
      id: 'f1',
      clientId: 'c1',
      productId: '123',
      createdAt: new Date(),
    };

    const mockProduct = { id: '123', title: 'P', image: 'img', price: 10 };

    jest.spyOn(prisma.favorite, 'findMany').mockResolvedValue([mockFavorite]);
    jest.spyOn(productsService, 'findById').mockResolvedValue(mockProduct);

    const res = await service.list('c1');

    expect(res[0].productId).toBe('123');
    expect(res[0]).toHaveProperty('title');
    expect(res[0]).toHaveProperty('image');
    expect(res[0]).toHaveProperty('price');
  });


  it('removes favorite', async () => {
    jest.spyOn(prisma.favorite, 'deleteMany').mockResolvedValue({ count: 1 });

    const res = await service.remove('c1', '123');

    expect(res.removed).toBe(true);
    expect(prisma.favorite.deleteMany).toHaveBeenCalled();
  });

  it('throws when removing non-existing', async () => {
    jest.spyOn(prisma.favorite, 'deleteMany').mockResolvedValue({ count: 0 });

    await expect(service.remove('c1', '999')).rejects.toThrow(NotFoundException);
  });
});
