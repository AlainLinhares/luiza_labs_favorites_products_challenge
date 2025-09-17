import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ProductsService } from '../../src/modules/products/products.service';

describe('App E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clientId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'file:memory:?cache=shared';
    const moduleBuilder = Test.createTestingModule({ imports: [AppModule] });

    moduleBuilder.overrideProvider(ProductsService).useValue({
      findById: async (id: string) => {
        if (id === '123') return { id: '123', title: 'Product 123', image: 'img', price: 10 };
        return null;
      },
    });
    const moduleRef = await moduleBuilder.compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
    await app.init();
  }, 20000);

  afterAll(async () => {
    await app.close();
  });

  it('creates a client', async () => {
    const res = await request(app.getHttpServer()).post('/clients').send({ name: 'A', email: 'a@b.com' });
    expect(res.status).toBe(201);
    clientId = res.body.id;
  });

  it('fails creating duplicate client', async () => {
    const res = await request(app.getHttpServer()).post('/clients').send({ name: 'A', email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('fetches client', async () => {
    const res = await request(app.getHttpServer()).get(`/clients/${clientId}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@b.com');
  });

  it('add favorite valid', async () => {
    const res = await request(app.getHttpServer()).post(`/clients/${clientId}/favorites`).send({ productId: '123' });
    expect(res.status).toBe(201);
  });

  it('add duplicate favorite', async () => {
    const res = await request(app.getHttpServer()).post(`/clients/${clientId}/favorites`).send({ productId: '123' });
    expect(res.status).toBe(400);
  });

  it('add invalid favorite', async () => {
    const res = await request(app.getHttpServer()).post(`/clients/${clientId}/favorites`).send({ productId: 'abc!' });
    expect(res.status).toBe(400);
  });

  it('list favorites', async () => {
    const res = await request(app.getHttpServer()).get(`/clients/${clientId}/favorites`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('title');
  });

  it('remove favorite', async () => {
    const res = await request(app.getHttpServer()).delete(`/clients/${clientId}/favorites/123`);
    expect(res.status).toBe(200);
  });

  it('remove non-existing favorite', async () => {
    const res = await request(app.getHttpServer()).delete(`/clients/${clientId}/favorites/999`);
    expect(res.status).toBe(404);
  });
});
