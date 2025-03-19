import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Products API (e2e)', () => {
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
    it('should return an array of products', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    it('should filter products by name', () => {
      return request(app.getHttpServer())
        .get('/api/products?name=Test')
        .expect(200);
    });

    it('should filter products by price range', () => {
      return request(app.getHttpServer())
        .get('/api/products?minPrice=10&maxPrice=100')
        .expect(200);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by ID', () => {
      // First get a list of products to extract a valid ID
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .then((res) => {
          if (res.body.length > 0) {
            const productId = res.body[0].id;
            return request(app.getHttpServer())
              .get(`/api/products/${productId}`)
              .expect(200)
              .expect((res) => {
                expect(res.body).toHaveProperty('id');
                expect(res.body).toHaveProperty('name');
                expect(res.body).toHaveProperty('price');
              });
          }
        });
    });
  });

  describe('GET /api/products/changes', () => {
    it('should return product price changes', () => {
      return request(app.getHttpServer())
        .get('/api/products/changes')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    it('should filter changes by timeframe', () => {
      return request(app.getHttpServer())
        .get('/api/products/changes?timeframe=24')
        .expect(200);
    });
  });
}); 