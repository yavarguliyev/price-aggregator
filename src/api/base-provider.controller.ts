import { Get } from "@nestjs/common";
import { Public } from "../core/auth/public.decorator";
import { ProviderProduct } from "../domain/entities/product.model";

/**
 * Abstract base controller for provider endpoints
 * Eliminates code duplication across provider controllers
 */
export abstract class BaseProviderController {
  /**
   * The service that provides product data
   */
  protected abstract readonly providerService: {
    getProducts(): ProviderProduct[];
  };

  /**
   * Get all products from this provider
   */
  @Get()
  @Public()
  getProducts() {
    return this.providerService.getProducts();
  }
}
