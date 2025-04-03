import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { AggregatorController } from '../../src/api/aggregator.controller';
import { AggregatorService } from '../../src/application/services/aggregator.service';
import { ProductChangesDto } from '../../src/domain/dto/product-changes.dto';

describe('AggregatorController (integration)', () => {
  let app: INestApplication;
  let aggregatorService: AggregatorService;

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const twoDaysAgo = new Date(now.getTime() - 86400000 * 2);

  const mockProductList = {
    data: [
      {
        id: '1',
        name: 'Test Product 1',
        description: 'Test description 1',
        price: 10.99,
        currency: 'USD',
        isAvailable: true,
        provider: 'provider1',
        providerId: 'p1-001',
        lastFetchedAt: now,
        isStale: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        name: 'Test Product 2',
        description: 'Test description 2',
        price: 20.99,
        currency: 'USD',
        isAvailable: false,
        provider: 'provider2',
        providerId: 'p2-002',
        lastFetchedAt: now,
        isStale: true,
        createdAt: now,
        updatedAt: now
      }
    ],
    total: 2,
    page: 1,
    limit: 10
  };

  const mockProduct = {
    data: {
      id: '1',
      name: 'Test Product 1',
      description: 'Test description 1',
      price: 10.99,
      currency: 'USD',
      isAvailable: true,
      provider: 'provider1',
      providerId: 'p1-001',
      lastFetchedAt: now,
      isStale: false,
      createdAt: now,
      updatedAt: now
    },
    priceHistory: [
      {
        amount: 9.99,
        currency: 'USD',
        timestamp: yesterday
      },
      {
        amount: 10.99,
        currency: 'USD',
        timestamp: now
      }
    ],
    availabilityHistory: [
      {
        isAvailable: true,
        timestamp: yesterday
      },
      {
        isAvailable: true,
        timestamp: now
      }
    ]
  };

  const mockChanges: ProductChangesDto[] = [
    {
      id: '1',
      name: 'Test Product 1',
      price: 10.99,
      currency: 'USD',
      isAvailable: true,
      provider: 'provider1',
      changedAt: now,
      previousPrice: 9.99,
      previousAvailability: true
    }
  ];

  const mockStaleProducts = {
    data: [
      {
        id: '2',
        name: 'Test Product 2',
        description: 'Test description 2',
        price: 20.99,
        currency: 'USD',
        isAvailable: false,
        provider: 'provider2',
        providerId: 'p2-002',
        lastFetchedAt: twoDaysAgo,
        isStale: true,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
      }
    ]
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AggregatorController],
      providers: [
        {
          provide: AggregatorService,
          useValue: {
            getAllProducts: jest.fn().mockResolvedValue(mockProductList),
            getProductById: jest.fn().mockImplementation((id: string) => {
              if (id === '1') {
                return Promise.resolve(mockProduct);
              }
              return Promise.resolve({
                data: null,
                priceHistory: [],
                availabilityHistory: []
              });
            }),
            getProductChanges: jest.fn().mockResolvedValue(mockChanges),
            getStaleProducts: jest.fn().mockResolvedValue(mockStaleProducts)
          }
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined)
          }
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn()
          }
        }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    aggregatorService = moduleFixture.get<AggregatorService>(AggregatorService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/products', () => {
    it('should return a list of products', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data.length).toBe(2);
          expect(res.body.total).toBe(2);
        });
    });

    it('should apply filters when provided', () => {
      return request(app.getHttpServer())
        .get('/api/products?name=Test&minPrice=5&maxPrice=15&provider=provider1')
        .expect(200)
        .expect((res) => {
          expect(aggregatorService.getAllProducts).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'Test',
              minPrice: 5,
              maxPrice: 15,
              provider: 'provider1'
            })
          );
        });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by id', () => {
      return request(app.getHttpServer())
        .get('/api/products/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data.id).toBe('1');
          expect(res.body).toHaveProperty('priceHistory');
          expect(res.body).toHaveProperty('availabilityHistory');
        });
    });

    it('should handle case when product is not found', () => {
      return request(app.getHttpServer())
        .get('/api/products/999')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toBeNull();
          expect(res.body.priceHistory).toEqual([]);
          expect(res.body.availabilityHistory).toEqual([]);
        });
    });
  });

  describe('GET /api/products/changes', () => {
    it('should return products with recent changes', () => {
      return request(app.getHttpServer())
        .get('/api/products/changes')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].id).toBe('1');
        });
    });

    it('should apply timeframe when provided', () => {
      return request(app.getHttpServer())
        .get('/api/products/changes?timeframe=60')
        .expect(200)
        .expect((res) => {
          expect(aggregatorService.getProductChanges).toHaveBeenCalledWith(3600000);
        });
    });
  });

  describe('GET /api/products/stale', () => {
    it('should return stale products', () => {
      return request(app.getHttpServer())
        .get('/api/products/stale')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data.length).toBe(1);
          expect(res.body.data[0].isStale).toBe(true);
        });
    });
  });
});
