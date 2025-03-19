import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";

import { PrismaModule } from "./infrastructure/persistence/prisma/prisma.module";
import { RedisCacheModule } from "./infrastructure/cache/cache.module";
import { ResilienceModule } from "./infrastructure/resilience/resilience.module";
import { AggregatorModule } from "./infrastructure/modules/aggregator.module";
import { ProviderSimulatorModule } from "./infrastructure/modules/provider-simulator.module";
import { HealthModule } from "./infrastructure/modules/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 20 }]),
    RedisCacheModule,
    ResilienceModule,
    PrismaModule,
    ProviderSimulatorModule,
    AggregatorModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
