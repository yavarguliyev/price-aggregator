import { Controller, Get } from "@nestjs/common";
import { ProviderOneService } from "../infrastructure/services/provider-one.service";
import { Public } from "../core/auth/public.decorator";

@Controller("provider-one")
export class ProviderOneController {
  constructor(private readonly providerOneService: ProviderOneService) {}

  @Get()
  @Public()
  getProducts() {
    return this.providerOneService.getProducts();
  }
}
