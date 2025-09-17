import { ClientsService } from '../../src/modules/clients/clients.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Client } from '@prisma/client';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  const mockClient: Client = {
    id: 'c1',
    name: 'A',
    email: 'a@b.com',
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = new PrismaService();
    service = new ClientsService(prisma);

    jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');
  });

  it('creates client successfully', async () => {
    jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.client, 'create').mockResolvedValue(mockClient);

    const res = await service.create({ name: 'A', email: 'a@b.com', password: 'secret' });

    expect(res).toHaveProperty('id');
    expect(res).not.toHaveProperty('password');
  });

  it('throws if email duplicate', async () => {
    jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);

    await expect(service.create({ name: 'A', email: 'a@b.com', password: 'secret' })).rejects.toThrow(BadRequestException);
  });

  it('finds client by id', async () => {
    jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(mockClient);

    const res = await service.findById('c1');

    expect(res.id).toBe('c1');
    expect(res).not.toHaveProperty('password');
  });

  it('throws if client not found', async () => {
    jest.spyOn(prisma.client, 'findUnique').mockResolvedValue(null);

    await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
  });
});
