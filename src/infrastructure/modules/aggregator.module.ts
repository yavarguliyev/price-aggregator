import { Module } from '@nestjs/common';
import { AggregatorService } from '../../application/services/aggregator.service';
import { AggregatorController } from '../../api/aggregator.controller';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { ProviderSimulatorModule } from './provider-simulator.module';
import { SseController } from '../../api/sse.controller';
import { ProductService } from '../../application/services/product.service';
import { ProviderService } from '../../application/services/provider.service';
import { ProductRepository } from '../persistence/product.repository';

@Module({
  imports: [PrismaModule, ProviderSimulatorModule],
  controllers: [AggregatorController, SseController],
  providers: [
    AggregatorService,
    ProductService,
    ProviderService,
    ProductRepository
  ],
  exports: [AggregatorService]
})
export class AggregatorModule {}
