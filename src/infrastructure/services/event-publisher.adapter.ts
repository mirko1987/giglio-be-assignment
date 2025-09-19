import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, of, from } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { EventPublisherPort } from '../../application/ports/event-publisher.port';
import { DomainEvent } from '../../domain/events/domain-event';

@Injectable()
export class EventPublisherAdapter implements EventPublisherPort {
  private readonly logger = new Logger(EventPublisherAdapter.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: DomainEvent): Observable<void> {
    this.logger.log(`Publishing domain event: ${event.eventType} for aggregate: ${event.getAggregateId()}`);
    
    return from(
      this.eventEmitter.emitAsync(event.eventType, event.getEventData())
    ).pipe(
      tap(() => {
        this.logger.log(`Successfully published event: ${event.eventType}`);
      }),
      map(() => undefined),
      catchError(error => {
        this.logger.error(`Failed to publish event: ${event.eventType}`, error);
        throw error;
      })
    );
  }

  publishMany(events: DomainEvent[]): Observable<void> {
    if (events.length === 0) {
      return of(void 0);
    }

    this.logger.log(`Publishing ${events.length} domain events`);

    const publishPromises = events.map(event => 
      this.eventEmitter.emitAsync(event.eventType, event.getEventData())
    );

    return from(Promise.all(publishPromises)).pipe(
      tap(() => {
        this.logger.log(`Successfully published ${events.length} events`);
      }),
      map(() => undefined),
      catchError(error => {
        this.logger.error(`Failed to publish events`, error);
        throw error;
      })
    );
  }
}

