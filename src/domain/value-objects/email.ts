export class Email {
  private readonly _value: string;

  constructor(value: string) {
    this._value = value;
    this.validate();
  }

  get value(): string {
    return this._value;
  }

  private validate(): void {
    if (!this._value) {
      throw new Error('Email is required');
    }

    if (this._value.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this._value)) {
      throw new Error('Email format is invalid');
    }

    if (this._value.length > 254) {
      throw new Error('Email must not exceed 254 characters');
    }
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
