import { FavoritesController } from '../../src/modules/favorites/favorites.controller';
import { FavoritesService } from '../../src/modules/favorites/favorites.service';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let service: FavoritesService;

  beforeEach(() => {
    service = { add: jest.fn(), list: jest.fn(), remove: jest.fn() } as any;
    controller = new FavoritesController(service);
  });

  it('add', async () => {
    (service.add as jest.Mock).mockResolvedValue({ id: 'f1' });
    const res = await controller.add('c1', { productId: '123' });
    expect(res.id).toBe('f1');
    expect(service.add).toHaveBeenCalledWith('c1', { productId: '123' });
  });

  it('list', async () => {
    (service.list as jest.Mock).mockResolvedValue([{ productId: '123' }]);
    const res = await controller.list('c1');
    expect(res[0].productId).toBe('123');
    expect(service.list).toHaveBeenCalledWith('c1');
  });

  it('remove', async () => {
    (service.remove as jest.Mock).mockResolvedValue({ removed: true });
    const res = await controller.remove('c1', '123');
    expect(res.removed).toBe(true);
    expect(service.remove).toHaveBeenCalledWith('c1', '123');
  });
});
