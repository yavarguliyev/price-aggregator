import { Controller, Get } from "@nestjs/common";
import { ProviderThreeService } from "../infrastructure/services/provider-three.service";
import { Public } from "../core/auth/public.decorator";

@Controller("provider-three")
export class ProviderThreeController {
  constructor(private readonly providerThreeService: ProviderThreeService) {}

  @Get()
  @Public()
  getProducts() {
    return this.providerThreeService.getProducts();
  }
}
