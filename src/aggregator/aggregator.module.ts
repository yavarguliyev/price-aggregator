import { Module } from '@nestjs/common';
import { AggregatorService } from './aggregator.service';
import { AggregatorController } from './aggregator.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProviderSimulatorModule } from '../provider-simulator/provider-simulator.module';
import { SseController } from './sse.controller';
import { ProductService } from './services/product.service';
import { ProviderService } from './services/provider.service';
import { ProductRepository } from './repositories/product.repository';

@Module({
  imports: [PrismaModule, ProviderSimulatorModule],
  controllers: [AggregatorController, SseController],
  providers: [
    AggregatorService,
    ProductService,
    ProviderService,
    ProductRepository
  ],
  exports: [AggregatorService],
})
export class AggregatorModule {} 