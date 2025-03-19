import { Module } from '@nestjs/common';
import { AggregatorService } from './aggregator.service';
import { AggregatorController } from './aggregator.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProviderSimulatorModule } from '../provider-simulator/provider-simulator.module';
import { SseController } from './sse.controller';

@Module({
  imports: [PrismaModule, ProviderSimulatorModule],
  controllers: [AggregatorController, SseController],
  providers: [AggregatorService],
  exports: [AggregatorService],
})
export class AggregatorModule {} 