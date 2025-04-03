export type ProductChangesDto = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly currency: string;
  readonly isAvailable: boolean;
  readonly provider: string;
  readonly changedAt: Date;
  readonly previousPrice?: number;
  readonly previousAvailability?: boolean;
};
