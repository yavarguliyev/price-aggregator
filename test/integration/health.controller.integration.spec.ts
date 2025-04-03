import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { DiskHealthIndicator, MemoryHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';

import { HealthController } from '../../src/api/health.controller';
import { PrismaService } from '../../src/infrastructure/persistence/prisma/prisma.service';

describe('HealthController (integration)', () => {
  let app: INestApplication;
  let prismaHealthIndicator: jest.Mocked<PrismaHealthIndicator>;
  let diskHealthIndicator: jest.Mocked<DiskHealthIndicator>;
  let memoryHealthIndicator: jest.Mocked<MemoryHealthIndicator>;

  const mockPingCheck = jest.fn().mockReturnValue({ database: { status: 'up' } });
  const mockCheckStorage = jest.fn().mockReturnValue({ storage: { status: 'up' } });
  const mockCheckHeap = jest.fn().mockReturnValue({ memory_heap: { status: 'up' } });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {}
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {
            pingCheck: mockPingCheck
          }
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: mockCheckStorage
          }
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: mockCheckHeap
          }
        }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prismaHealthIndicator = moduleFixture.get(PrismaHealthIndicator);
    diskHealthIndicator = moduleFixture.get(DiskHealthIndicator);
    memoryHealthIndicator = moduleFixture.get(MemoryHealthIndicator);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health check information', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('info');
        });
    });

    it('should call all health indicators', async () => {
      await request(app.getHttpServer()).get('/api/health');

      expect(mockPingCheck).toHaveBeenCalledWith('database', expect.any(Object));
      expect(mockCheckStorage).toHaveBeenCalledWith('storage', { path: '/', thresholdPercent: 0.9 });
      expect(mockCheckHeap).toHaveBeenCalledWith('memory_heap', 300 * 1024 * 1024);
    });
  });
});
