export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export class OrderStatusVO {
  private readonly _value: OrderStatus;

  constructor(status: OrderStatus) {
    this._value = status;
    this.validate();
  }

  static fromString(status: string): OrderStatusVO {
    const upperStatus = status.toUpperCase();
    if (!Object.values(OrderStatus).includes(upperStatus as OrderStatus)) {
      throw new Error(`Invalid order status: ${status}. Valid statuses are: ${Object.values(OrderStatus).join(', ')}`);
    }
    return new OrderStatusVO(upperStatus as OrderStatus);
  }

  get value(): OrderStatus {
    return this._value;
  }

  private validate(): void {
    if (!Object.values(OrderStatus).includes(this._value)) {
      throw new Error(`Invalid order status: ${this._value}`);
    }
  }

  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: []
    };

    return transitions[this._value].includes(newStatus);
  }

  equals(other: OrderStatusVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}
