import * as crypto from 'crypto';

export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType: string;

  constructor(eventType: string) {
    this.occurredAt = new Date();
    this.eventId = crypto.randomUUID();
    this.eventType = eventType;
  }

  abstract getAggregateId(): string;
  
  getEventData(): any {
    return this;
  }
}
