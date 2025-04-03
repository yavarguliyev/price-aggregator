import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Server } from 'http';

import { AppModule } from '../../src/app.module';

interface ProductResponse {
  id: string;
  name: string;
  price: number;
  [key: string]: unknown;
}

interface ProductsListResponse {
  data: ProductResponse[];
  total: number;
  page: number;
  limit: number;
}

interface ProductChangesResponse {
  data: Array<{
    id: string;
    name: string;
    changeType: string;
    newValue: number | boolean;
    [key: string]: unknown;
  }>;
}

describe('Products API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/products', () => {
    it('should return an array of products', () => {
      return request(app.getHttpServer() as unknown as Server)
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          const response = res.body as ProductsListResponse;
          expect(Array.isArray(response.data)).toBeTruthy();
        });
    });

    it('should filter products by name', () => {
      return request(app.getHttpServer() as unknown as Server)
        .get('/api/products?name=Test')
        .expect(200);
    });

    it('should filter products by price range', () => {
      return request(app.getHttpServer() as unknown as Server)
        .get('/api/products?minPrice=10&maxPrice=100')
        .expect(200);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by ID', () => {
      return request(app.getHttpServer() as unknown as Server)
        .get('/api/products')
        .expect(200)
        .then((res) => {
          const response = res.body as ProductsListResponse;
          if (response.data.length > 0) {
            const productId = response.data[0].id;
            return request(app.getHttpServer() as unknown as Server)
              .get(`/api/products/${productId}`)
              .expect(200)
              .expect((res) => {
                const product = res.body as ProductResponse;
                expect(product).toHaveProperty('id');
                expect(product).toHaveProperty('name');
                expect(product).toHaveProperty('price');
              });
          }
          return undefined;
        });
    });
  });

  describe('GET /api/products/changes', () => {
    it('should return product price changes', () => {
      return request(app.getHttpServer() as unknown as Server)
        .get('/api/products/changes')
        .expect(200)
        .expect((res) => {
          const response = res.body as ProductChangesResponse;
          expect(Array.isArray(response.data)).toBeTruthy();
        });
    });

    it('should filter changes by timeframe', () => {
      return request(app.getHttpServer() as unknown as Server)
        .get('/api/products/changes?timeframe=24')
        .expect(200);
    });
  });
});
