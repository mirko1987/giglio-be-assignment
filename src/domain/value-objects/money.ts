export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  constructor(amount: number, currency: string) {
    this._amount = amount;
    this._currency = currency;
    this.validate();
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  private validate(): void {
    if (this._amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!this._currency || this._currency.trim() === '') {
      throw new Error('Currency is required');
    }
    if (this._currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code (e.g., USD, EUR)');
    }
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount - other._amount, this._currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Multiplication factor cannot be negative');
    }
    return new Money(this._amount * factor, this._currency);
  }

  divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new Error('Division divisor must be positive');
    }
    return new Money(this._amount / divisor, this._currency);
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `Cannot operate on different currencies: ${this._currency} and ${other._currency}`,
      );
    }
  }

  toString(): string {
    return `${this._amount.toFixed(2)} ${this._currency}`;
  }

  toJSON() {
    return {
      amount: this._amount,
      currency: this._currency,
    };
  }
}
