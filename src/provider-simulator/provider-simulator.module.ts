import { Module } from '@nestjs/common';
import { ProviderOneService } from './providers/provider-one.service';
import { ProviderTwoService } from './providers/provider-two.service';
import { ProviderThreeService } from './providers/provider-three.service';
import { ProviderOneController } from './controllers/provider-one.controller';
import { ProviderTwoController } from './controllers/provider-two.controller';
import { ProviderThreeController } from './controllers/provider-three.controller';

@Module({
  controllers: [ProviderOneController, ProviderTwoController, ProviderThreeController],
  providers: [ProviderOneService, ProviderTwoService, ProviderThreeService],
  exports: [ProviderOneService, ProviderTwoService, ProviderThreeService],
})
export class ProviderSimulatorModule {} 