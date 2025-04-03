export class Price {
  readonly value: number;
  readonly currency: string;
  readonly timestamp: Date;

  constructor (params: { value: number; currency: string; timestamp?: Date }) {
    this.value = params.value;
    this.currency = params.currency;
    this.timestamp = params.timestamp || new Date();
  }

  equals (price: Price): boolean {
    return this.value === price.value && this.currency === price.currency;
  }

  toString (): string {
    return `${this.value} ${this.currency}`;
  }
}
