import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AggregatorService } from '../../application/services/aggregator.service';
import { AggregatorController } from '../../api/aggregator.controller';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { ProviderSimulatorModule } from './provider-simulator.module';
import { ProductService } from '../../application/services/product.service';
import { ProviderService } from '../../application/services/provider.service';
import { ProductRepository } from '../persistence/product.repository';

@Module({
  imports: [PrismaModule, ProviderSimulatorModule, ConfigModule, EventEmitterModule],
  controllers: [AggregatorController],
  providers: [AggregatorService, ProductService, ProviderService, ProductRepository],
  exports: [AggregatorService]
})
export class AggregatorModule {}
