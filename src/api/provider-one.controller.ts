import { Controller } from "@nestjs/common";
import { ProviderOneService } from "../infrastructure/services/provider-one.service";
import { BaseProviderController } from "./base-provider.controller";

@Controller("provider-one")
export class ProviderOneController extends BaseProviderController {
  constructor(protected readonly providerService: ProviderOneService) {
    super();
  }
}
