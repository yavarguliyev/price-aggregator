import { Module } from '@nestjs/common';
import { ProviderOneService } from './providers/provider-one.service';
import { ProviderTwoService } from './providers/provider-two.service';
import { ProviderOneController } from './controllers/provider-one.controller';
import { ProviderTwoController } from './controllers/provider-two.controller';

@Module({
  controllers: [ProviderOneController, ProviderTwoController],
  providers: [ProviderOneService, ProviderTwoService],
  exports: [ProviderOneService, ProviderTwoService],
})
export class ProviderSimulatorModule {} 