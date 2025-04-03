import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ProviderOneService } from '../services/provider-one.service';
import { ProviderTwoService } from '../services/provider-two.service';
import { ProviderThreeService } from '../services/provider-three.service';
import { ProviderFourService } from '../services/provider-four.service';
import { ProviderController } from '../../api/provider.controller';
import { ProviderService } from '../../application/services/provider.service';
import { ProductRepository } from '../persistence/product.repository';
import { PrismaModule } from '../persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule, EventEmitterModule],
  controllers: [ProviderController],
  providers: [
    ProviderOneService,
    ProviderTwoService,
    ProviderThreeService,
    ProviderFourService,
    ProviderService,
    ProductRepository
  ],
  exports: [ProviderOneService, ProviderTwoService, ProviderThreeService, ProviderFourService, ProviderService]
})
export class ProviderSimulatorModule {}
