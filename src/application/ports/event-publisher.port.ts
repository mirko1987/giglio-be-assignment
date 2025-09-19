import { Observable } from 'rxjs';
import { DomainEvent } from '../../domain/events/domain-event';

export interface EventPublisherPort {
  publish(event: DomainEvent): Observable<void>;
  publishMany(events: DomainEvent[]): Observable<void>;
}

