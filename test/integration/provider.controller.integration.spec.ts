import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';

import { ProviderController } from '../../src/api/provider.controller';
import { ProviderService } from '../../src/application/services/provider.service';

describe('ProviderController (integration)', () => {
  let app: INestApplication;
  let providerService: ProviderService;

  const mockProviderProducts = {
    provider: 'provider1',
    products: [
      {
        id: 'p1-001',
        name: 'Provider 1 Product',
        description: 'Test product from provider 1',
        price: 15.99,
        currency: 'USD',
        isAvailable: true
      },
      {
        id: 'p1-002',
        name: 'Another Provider 1 Product',
        description: 'Another test product from provider 1',
        price: 25.99,
        currency: 'USD',
        isAvailable: false
      }
    ]
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [ProviderController],
      providers: [
        {
          provide: ProviderService,
          useValue: {
            getProviderProducts: jest.fn().mockImplementation((providerId) => {
              if (providerId === 'provider1') {
                return Promise.resolve(mockProviderProducts);
              }
              return Promise.resolve({ provider: providerId, products: [] });
            })
          }
        }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    providerService = moduleFixture.get<ProviderService>(ProviderService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/providers/:providerId', () => {
    it('should return products from a provider when valid providerId is provided', () => {
      return request(app.getHttpServer())
        .get('/api/providers/provider1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(mockProviderProducts);
          expect(res.body.provider).toBe('provider1');
          expect(res.body.products.length).toBe(2);
        });
    });

    it('should return empty products array for unknown provider', () => {
      return request(app.getHttpServer())
        .get('/api/providers/unknown')
        .expect(200)
        .expect((res) => {
          expect(res.body.provider).toBe('unknown');
          expect(res.body.products).toEqual([]);
        });
    });

    it('should call the service with the correct provider ID', () => {
      return request(app.getHttpServer())
        .get('/api/providers/provider1')
        .expect(200)
        .expect(() => {
          expect(providerService.getProviderProducts).toHaveBeenCalledWith('provider1');
        });
    });
  });
});
