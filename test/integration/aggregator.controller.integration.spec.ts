import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { ConfigModule, ConfigService } from "@nestjs/config";

describe("AggregatorController (Integration)", () => {
  let app: INestApplication;
  let API_KEY: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api"); // Set the same global prefix as in main.ts
    await app.init();

    const configService = app.get(ConfigService);
    API_KEY = configService.get<string>("API_KEY") || "test-api-key";
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/products", () => {
    it("should return a successful response", () => {
      return request(app.getHttpServer())
        .get("/api/products")
        .set("X-API-KEY", API_KEY)
        .expect(200);
    });

    it("should accept price range filters", () => {
      return request(app.getHttpServer())
        .get("/api/products?minPrice=10&maxPrice=100")
        .set("X-API-KEY", API_KEY)
        .expect(200);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should handle product ID requests", () => {
      return request(app.getHttpServer())
        .get("/api/products/1")
        .set("X-API-KEY", API_KEY)
        .expect((res) => {
          // Just check that we get a valid response
          expect(res.status === 200 || res.status === 404).toBeTruthy();
        });
    });
  });
});
