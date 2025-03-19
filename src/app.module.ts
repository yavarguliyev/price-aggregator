import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProviderSimulatorModule } from './provider-simulator/provider-simulator.module';
import { AggregatorModule } from './aggregator/aggregator.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrismaModule, 
    ProviderSimulatorModule, 
    AggregatorModule,
    AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
