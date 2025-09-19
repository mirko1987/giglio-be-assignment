import { DomainEvent } from './domain-event';
import { Money } from '../value-objects/money';

export class OrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly totalAmount: Money,
    public readonly customerId?: string, // For backward compatibility
    public readonly customerName?: string,
    public readonly customerEmail?: string
  ) {
    super('OrderCreated');
  }

  getAggregateId(): string {
    return this.orderId;
  }
}
