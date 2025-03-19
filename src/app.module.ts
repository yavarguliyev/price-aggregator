import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProviderSimulatorModule } from './provider-simulator/provider-simulator.module';
import { AggregatorModule } from './aggregator/aggregator.module';
import { AuthModule } from './auth/auth.module';
import { RedisCacheModule } from './cache/cache.module';

@Module({
  imports: [
    // Load and validate environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Redis cache module for performance
    RedisCacheModule,
    // Core modules
    PrismaModule, 
    ProviderSimulatorModule, 
    AggregatorModule,
    AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
