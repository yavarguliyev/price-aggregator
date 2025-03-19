import { Controller, Get } from "@nestjs/common";
import { ProviderTwoService } from "../infrastructure/services/provider-two.service";
import { Public } from "../core/auth/public.decorator";

@Controller("provider-two")
export class ProviderTwoController {
  constructor(private readonly providerTwoService: ProviderTwoService) {}

  @Get()
  @Public()
  getProducts() {
    return this.providerTwoService.getProducts();
  }
}
