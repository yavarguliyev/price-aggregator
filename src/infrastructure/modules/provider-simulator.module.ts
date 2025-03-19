import { Module } from "@nestjs/common";
import { ProviderOneService } from "../services/provider-one.service";
import { ProviderTwoService } from "../services/provider-two.service";
import { ProviderThreeService } from "../services/provider-three.service";
import { ProviderFourService } from "../services/provider-four.service";
import { ProviderOneController } from "../../api/provider-one.controller";
import { ProviderTwoController } from "../../api/provider-two.controller";
import { ProviderThreeController } from "../../api/provider-three.controller";
import { ProviderFourController } from "../../api/provider-four.controller";

@Module({
  controllers: [
    ProviderOneController,
    ProviderTwoController,
    ProviderThreeController,
    ProviderFourController,
  ],
  providers: [
    ProviderOneService,
    ProviderTwoService,
    ProviderThreeService,
    ProviderFourService,
  ],
  exports: [
    ProviderOneService,
    ProviderTwoService,
    ProviderThreeService,
    ProviderFourService,
  ],
})
export class ProviderSimulatorModule {}
