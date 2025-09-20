import { Observable } from 'rxjs';
import { Order } from '../../domain/entities/order.entity';

export interface OrderRepositoryPort {
  save(order: Order): Observable<Order>;
  findById(id: string): Observable<Order | null>;
  findByUserId(userId: string): Observable<Order[]>;
  findByStatus(status: string): Observable<Order[]>;
  findAll(): Observable<Order[]>;
  delete(id: string): Observable<void>;
  exists(id: string): Observable<boolean>;
}
