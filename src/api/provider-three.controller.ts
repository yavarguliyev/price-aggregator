import { Controller } from "@nestjs/common";
import { ProviderThreeService } from "../infrastructure/services/provider-three.service";
import { BaseProviderController } from "./base-provider.controller";

@Controller("provider-three")
export class ProviderThreeController extends BaseProviderController {
  constructor(protected readonly providerService: ProviderThreeService) {
    super();
  }
}
