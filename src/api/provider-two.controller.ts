import { Controller } from "@nestjs/common";
import { ProviderTwoService } from "../infrastructure/services/provider-two.service";
import { BaseProviderController } from "./base-provider.controller";

@Controller("provider-two")
export class ProviderTwoController extends BaseProviderController {
  constructor(protected readonly providerService: ProviderTwoService) {
    super();
  }
}
