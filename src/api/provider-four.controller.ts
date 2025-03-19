import { Controller } from "@nestjs/common";
import { ProviderFourService } from "../infrastructure/services/provider-four.service";
import { BaseProviderController } from "./base-provider.controller";

@Controller("provider-four")
export class ProviderFourController extends BaseProviderController {
  constructor(protected readonly providerService: ProviderFourService) {
    super();
  }
}
