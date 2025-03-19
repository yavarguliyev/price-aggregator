import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProviderSimulatorModule } from './provider-simulator/provider-simulator.module';
import { AggregatorModule } from './aggregator/aggregator.module';
import { AuthModule } from './auth/auth.module';
import { RedisCacheModule } from './cache/cache.module';
import { ResilienceModule } from './common/resilience/resilience.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from './health/health.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // Load and validate environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Event emitter for real-time updates
    EventEmitterModule.forRoot(),
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60, // 60 seconds
      limit: 20, // 20 requests per ttl
    }]),
    // Redis cache module for performance
    RedisCacheModule,
    // Resilience module for error handling
    ResilienceModule,
    // Core modules
    PrismaModule, 
    ProviderSimulatorModule, 
    AggregatorModule,
    AuthModule,
    // Health checks
    HealthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
