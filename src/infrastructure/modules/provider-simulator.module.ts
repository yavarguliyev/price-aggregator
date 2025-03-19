import { Module } from '@nestjs/common';
import { ProviderOneService } from '../services/provider-one.service';
import { ProviderTwoService } from '../services/provider-two.service';
import { ProviderThreeService } from '../services/provider-three.service';
import { ProviderOneController } from '../../api/provider-one.controller';
import { ProviderTwoController } from '../../api/provider-two.controller';
import { ProviderThreeController } from '../../api/provider-three.controller';

@Module({
  controllers: [
    ProviderOneController,
    ProviderTwoController,
    ProviderThreeController
  ],
  providers: [ProviderOneService, ProviderTwoService, ProviderThreeService],
  exports: [ProviderOneService, ProviderTwoService, ProviderThreeService]
})
export class ProviderSimulatorModule {}
