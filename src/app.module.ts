import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProviderSimulatorModule } from './provider-simulator/provider-simulator.module';
import { AggregatorModule } from './aggregator/aggregator.module';

@Module({
  imports: [PrismaModule, ProviderSimulatorModule, AggregatorModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
