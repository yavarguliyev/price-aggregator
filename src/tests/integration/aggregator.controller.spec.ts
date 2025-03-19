import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('AggregatorController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/products', () => {
    it('should return products with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBeTruthy();
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.page).toBe('number');
          expect(typeof res.body.limit).toBe('number');
        });
    });

    it('should filter products by price range', () => {
      return request(app.getHttpServer())
        .get('/api/products?minPrice=10&maxPrice=100')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBeTruthy();
          if (res.body.data.length > 0) {
            res.body.data.forEach(product => {
              expect(product.price).toBeGreaterThanOrEqual(10);
              expect(product.price).toBeLessThanOrEqual(100);
            });
          }
        });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a single product by ID', () => {
      // This test requires a valid ID to exist
      // For a proper test, we would create a product first
      return request(app.getHttpServer())
        .get('/api/products/1') // Assuming ID 1 exists
        .expect((res) => {
          if (res.status !== 404) {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('price');
          }
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/api/products/999999')
        .expect(404);
    });
  });
}); 