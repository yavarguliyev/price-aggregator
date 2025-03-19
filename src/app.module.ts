import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";

// Updated imports for infrastructure modules
import { PrismaModule } from "./infrastructure/persistence/prisma/prisma.module";
import { RedisCacheModule } from "./infrastructure/cache/cache.module";
import { ResilienceModule } from "./infrastructure/resilience/resilience.module";
import { AggregatorModule } from "./infrastructure/modules/aggregator.module";
import { ProviderSimulatorModule } from "./infrastructure/modules/provider-simulator.module";
import { HealthModule } from "./infrastructure/modules/health.module";

@Module({
  imports: [
    // Load and validate environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Event emitter for real-time updates
    EventEmitterModule.forRoot(),
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60, // 60 seconds
        limit: 20, // 20 requests per ttl
      },
    ]),
    // Redis cache module for performance
    RedisCacheModule,
    // Resilience module for error handling
    ResilienceModule,
    // Core modules
    PrismaModule,
    // Feature modules
    ProviderSimulatorModule,
    AggregatorModule,
    // Health checks
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
