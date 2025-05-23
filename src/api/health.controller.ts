import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Public } from '../core/auth/public.decorator';
import { PrismaService } from '../infrastructure/persistence/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor (
    private health: HealthCheckService,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private prismaService: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check overall application health' })
  @ApiResponse({ status: 200, description: 'The application is healthy' })
  @ApiResponse({ status: 503, description: 'The application is not healthy' })
  async check () {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prismaService),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024)
    ]);
  }
}
