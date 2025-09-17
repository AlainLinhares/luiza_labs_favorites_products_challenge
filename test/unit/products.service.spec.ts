import { ProductsService } from '../../src/modules/products/products.service';
import axios from 'axios';
import { BadGatewayException } from '@nestjs/common';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(() => {
    service = new ProductsService();
    service.setMockMode(false);
    service.resetState();
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2023-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns product when found', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: '1', title: 'P' } });
    const p = await service.findById('1');
    expect(p).toBeTruthy();
    expect(p.title).toBe('P');
  });

  it('returns null when product not found', async () => {
    mockedAxios.get.mockResolvedValue({ data: {} });
    const p = await service.findById('1');
    expect(p).toBeNull();
  });

  it('returns product from cache', async () => {
    const mockProduct = { id: '1', title: 'Cached' };
    (service as any).cache.set('product:1', { data: mockProduct, expiresAt: Date.now() + 10000 });

    const result = await service.findById('1');
    expect(result).toEqual(mockProduct);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('stores product in cache after fetch', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: '1', title: 'Fresh' } });
    const result = await service.findById('1');
    const cached = (service as any).cache.get('product:1');
    expect(cached.data).toEqual(result);
  });

  it('opens circuit after repeated failures and logs warning', async () => {
    const warnSpy = jest.spyOn(service['logger'], 'warn');
    mockedAxios.get.mockRejectedValue(new Error('network'));

    try { await service.findById('1'); } catch {}
    try { await service.findById('1'); } catch {}
    try { await service.findById('1'); } catch {}

    await expect(service.findById('1')).rejects.toThrow('Product API temporarily unavailable');
    expect(warnSpy).toHaveBeenCalledWith('Circuit opened due to repeated failures');
  });

  it('allows requests after circuit timeout', async () => {
    mockedAxios.get.mockRejectedValue(new Error('fail'));

    try { await service.findById('1'); } catch {}
    try { await service.findById('1'); } catch {}
    try { await service.findById('1'); } catch {}

    await expect(service.findById('1')).rejects.toThrow(BadGatewayException);

    jest.setSystemTime(Date.now() + 31000);

    mockedAxios.get.mockResolvedValue({ data: { id: '1', title: 'Recovered' } });
    const result = await service.findById('1');
    expect(result.title).toBe('Recovered');
  });

  it('returns null when product lacks id', async () => {
    mockedAxios.get.mockResolvedValue({ data: { title: 'No ID' } });
    const result = await service.findById('1');
    expect(result).toBeNull();
  });

  it('lists products by page', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ id: '1', title: 'Product 1' }] });
    const result = await service.listByPage(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].title).toBe('Product 1');
  });

  it('returns product list from cache', async () => {
    const mockList = [{ id: '1', title: 'Cached List' }];
    (service as any).cache.set('page:1', { data: mockList, expiresAt: Date.now() + 10000 });

    const result = await service.listByPage(1);
    expect(result).toEqual(mockList);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('handles list failure and opens circuit', async () => {
    mockedAxios.get.mockRejectedValue(new Error('list failure'));

    try { await service.listByPage(1); } catch {}
    try { await service.listByPage(1); } catch {}
    try { await service.listByPage(1); } catch {}

    await expect(service.listByPage(1)).rejects.toThrow(BadGatewayException);
  });

  it('logs unknown error when exception is not instance of Error', async () => {
    const debugSpy = jest.spyOn(service['logger'], 'debug');
    mockedAxios.get.mockRejectedValue('some non-error');

    await expect(service.findById('1')).rejects.toThrow(BadGatewayException);
    expect(debugSpy).toHaveBeenCalledWith('Unknown error');
  });

  it('logs unknown error on listByPage when error is not instance of Error', async () => {
    const debugSpy = jest.spyOn(service['logger'], 'debug');
    mockedAxios.get.mockRejectedValue('some non-error');

    await expect(service.listByPage(1)).rejects.toThrow(BadGatewayException);
    expect(debugSpy).toHaveBeenCalledWith('Unknown error');
  });

  it('returns mock product when API fails and useMockOnFailure is true', async () => {
    service.setMockMode(true);
    mockedAxios.get.mockRejectedValue(new Error('network'));

    const warnSpy = jest.spyOn(service['logger'], 'warn');

    const result = await service.findById('mock-product-id');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Using mock product for id'));
  });

  it('returns mock product list when API fails and useMockOnFailure is true', async () => {
    service.setMockMode(true);
    mockedAxios.get.mockRejectedValue(new Error('fail'));

    const warnSpy = jest.spyOn(service['logger'], 'warn');

    const result = await service.listByPage(1);
    expect(Array.isArray(result)).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Using mock product list for page'));
  });
});
