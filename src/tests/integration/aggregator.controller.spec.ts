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
    it('should return a successful response', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200);
    });

    it('should accept price range filters', () => {
      return request(app.getHttpServer())
        .get('/api/products?minPrice=10&maxPrice=100')
        .expect(200);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should handle product ID requests', () => {
      return request(app.getHttpServer())
        .get('/api/products/1')
        .expect((res) => {
          // Just check that we get a valid response
          expect(res.status === 200 || res.status === 404).toBeTruthy();
        });
    });
  });
}); 