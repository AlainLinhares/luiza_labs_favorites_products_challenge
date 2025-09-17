import { ClientsController } from '../../src/modules/clients/clients.controller';
import { ClientsService } from '../../src/modules/clients/clients.service';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;

  beforeEach(() => {
    service = { create: jest.fn(), findById: jest.fn() } as any;
    controller = new ClientsController(service);
  });

  it('create', async () => {
    (service.create as jest.Mock).mockResolvedValue({ id: 'c1' });
    const res = await controller.create({ name: 'A', email: 'a@b.com' });
    expect(res.id).toBe('c1');
    expect(service.create).toHaveBeenCalled();
  });

  it('find', async () => {
    (service.findById as jest.Mock).mockResolvedValue({ id: 'c1' });
    const res = await controller.find('c1');
    expect(res.id).toBe('c1');
    expect(service.findById).toHaveBeenCalledWith('c1');
  });
});
