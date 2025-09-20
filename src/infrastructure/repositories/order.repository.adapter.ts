import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { OrderRepositoryPort } from '../../application/ports/order.repository.port';
import { Order } from '../../domain/entities/order.entity';
import { OrderOrmEntity } from '../database/entities/order.orm-entity';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class OrderRepositoryAdapter implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly orderRepository: Repository<OrderOrmEntity>,
  ) {}

  save(order: Order): Observable<Order> {
    const orderOrm = OrderMapper.toOrmEntity(order);

    return from(this.orderRepository.save(orderOrm)).pipe(
      switchMap((savedOrderOrm) =>
        // Reload the entity with all relations to ensure proper mapping
        from(
          this.orderRepository.findOne({
            where: { id: savedOrderOrm.id },
            relations: ['user', 'items', 'items.product'],
          }),
        ),
      ),
      map((reloadedOrderOrm) => {
        if (!reloadedOrderOrm) {
          throw new Error('Failed to reload saved order');
        }
        return OrderMapper.toDomainEntity(reloadedOrderOrm);
      }),
      catchError((error) => throwError(() => new Error(`Failed to save order: ${error.message}`))),
    );
  }

  findById(id: string): Observable<Order | null> {
    return from(
      this.orderRepository.findOne({
        where: { id },
        relations: ['user', 'items', 'items.product'],
      }),
    ).pipe(
      map((orderOrm) => (orderOrm ? OrderMapper.toDomainEntity(orderOrm) : null)),
      catchError((error) =>
        throwError(() => new Error(`Failed to find order by ID: ${error.message}`)),
      ),
    );
  }

  findByUserId(userId: string): Observable<Order[]> {
    return from(
      this.orderRepository.find({
        where: { userId },
        relations: ['user', 'items', 'items.product'],
        order: { createdAt: 'DESC' },
      }),
    ).pipe(
      map((ordersOrm) => ordersOrm.map((orderOrm) => OrderMapper.toDomainEntity(orderOrm))),
      catchError((error) =>
        throwError(() => new Error(`Failed to find orders by customer ID: ${error.message}`)),
      ),
    );
  }

  findByStatus(status: string): Observable<Order[]> {
    return from(
      this.orderRepository.find({
        where: { status },
        relations: ['user', 'items', 'items.product'],
        order: { createdAt: 'DESC' },
      }),
    ).pipe(
      map((ordersOrm) => ordersOrm.map((orderOrm) => OrderMapper.toDomainEntity(orderOrm))),
      catchError((error) =>
        throwError(() => new Error(`Failed to find orders by status: ${error.message}`)),
      ),
    );
  }

  findAll(): Observable<Order[]> {
    return from(
      this.orderRepository.find({
        relations: ['user', 'items', 'items.product'],
        order: { createdAt: 'DESC' },
      }),
    ).pipe(
      map((ordersOrm) => ordersOrm.map((orderOrm) => OrderMapper.toDomainEntity(orderOrm))),
      catchError((error) =>
        throwError(() => new Error(`Failed to find all orders: ${error.message}`)),
      ),
    );
  }

  delete(id: string): Observable<void> {
    return from(this.orderRepository.delete(id)).pipe(
      map((result) => {
        if (result.affected === 0) {
          throw new Error(`Order with ID ${id} not found`);
        }
      }),
      catchError((error) =>
        throwError(() => new Error(`Failed to delete order: ${error.message}`)),
      ),
    );
  }

  exists(id: string): Observable<boolean> {
    return from(this.orderRepository.exists({ where: { id } })).pipe(
      catchError((error) =>
        throwError(() => new Error(`Failed to check order existence: ${error.message}`)),
      ),
    );
  }
}
