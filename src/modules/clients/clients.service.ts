import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    const exists = await this.prisma.client.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new BadRequestException('Email already in use');
    }

    const client = await this.prisma.client.create({
      data: {
        name: dto.name,
        email: dto.email,
      },
    });

    return client;
  }

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');

    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');

    if (dto.email && dto.email !== client.email) {
      const emailExists = await this.prisma.client.findUnique({ where: { email: dto.email } });
      if (emailExists) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: {
        name: dto.name ?? client.name,
        email: dto.email ?? client.email,
      },
    });

    return updatedClient;
  }

  async remove(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');

    await this.prisma.client.delete({ where: { id } });

    return { message: 'Client removed successfully' };
  }

  async findAll() {
    const clients = await this.prisma.client.findMany();

    if (clients.length === 0) {
      throw new NotFoundException('No clients found');
    }

    return clients;
  }
}
