import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { Public } from "../core/auth/public.decorator";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PrismaService } from "../infrastructure/persistence/prisma/prisma.service";

@ApiTags("Health")
@Controller("health")
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private prismaService: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Check overall application health" })
  @ApiResponse({ status: 200, description: "The application is healthy" })
  @ApiResponse({ status: 503, description: "The application is not healthy" })
  async check() {
    return this.health.check([
      // Database health check
      () => this.prismaHealth.pingCheck("database", this.prismaService),

      // Disk storage health check
      () =>
        this.disk.checkStorage("storage", { path: "/", thresholdPercent: 0.9 }),

      // Memory usage health check
      () => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024), // 300MB
    ]);
  }
}
