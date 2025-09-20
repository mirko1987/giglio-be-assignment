import { Injectable, Logger, Inject } from '@nestjs/common';
import { Observable, interval, mergeMap, takeUntil, Subject, firstValueFrom, of, from } from 'rxjs';
import { OrderRepositoryPort } from '../ports/order.repository.port';
import { OrderStatus } from '../../domain/value-objects/order-status';

@Injectable()
export class OrderProcessingService {
  private readonly logger = new Logger(OrderProcessingService.name);
  private readonly stopProcessing$ = new Subject<void>();

  constructor(
    @Inject('OrderRepositoryPort') private readonly orderRepository: OrderRepositoryPort,
  ) {}

  startOrderProcessing(): void {
    this.logger.log('Starting order processing service');

    // Process pending orders every 30 seconds
    interval(30000)
      .pipe(
        takeUntil(this.stopProcessing$),
        mergeMap(() => this.processPendingOrders()),
      )
      .subscribe({
        next: (processedCount) => {
          if (processedCount > 0) {
            this.logger.log(`Processed ${processedCount} pending orders`);
          }
        },
        error: (error) => {
          this.logger.error('Error in order processing service', error);
        },
      });

    // Process confirmed orders every 60 seconds
    interval(60000)
      .pipe(
        takeUntil(this.stopProcessing$),
        mergeMap(() => this.processConfirmedOrders()),
      )
      .subscribe({
        next: (processedCount) => {
          if (processedCount > 0) {
            this.logger.log(`Processed ${processedCount} confirmed orders`);
          }
        },
        error: (error) => {
          this.logger.error('Error in order processing service', error);
        },
      });
  }

  stopOrderProcessing(): void {
    this.logger.log('Stopping order processing service');
    this.stopProcessing$.next();
    this.stopProcessing$.complete();
  }

  private processPendingOrders(): Observable<number> {
    return this.orderRepository.findByStatus(OrderStatus.PENDING.toString()).pipe(
      mergeMap((orders) => {
        const ordersToProcess = orders.filter((order) =>
          this.shouldProcessOrder(order, OrderStatus.PENDING),
        );

        if (ordersToProcess.length === 0) {
          return of(0);
        }

        this.logger.log(`Found ${ordersToProcess.length} pending orders to process`);

        // Simulate order processing
        const processPromises = ordersToProcess.map((order) =>
          this.simulateOrderProcessing(order, OrderStatus.CONFIRMED),
        );

        return from(Promise.all(processPromises)).pipe(mergeMap(() => of(ordersToProcess.length)));
      }),
    );
  }

  private processConfirmedOrders(): Observable<number> {
    return this.orderRepository.findByStatus(OrderStatus.CONFIRMED.toString()).pipe(
      mergeMap((orders) => {
        const ordersToProcess = orders.filter((order) =>
          this.shouldProcessOrder(order, OrderStatus.CONFIRMED),
        );

        if (ordersToProcess.length === 0) {
          return of(0);
        }

        this.logger.log(`Found ${ordersToProcess.length} confirmed orders to process`);

        // Simulate order processing
        const processPromises = ordersToProcess.map((order) =>
          this.simulateOrderProcessing(order, OrderStatus.PROCESSING),
        );

        return from(Promise.all(processPromises)).pipe(mergeMap(() => of(ordersToProcess.length)));
      }),
    );
  }

  private shouldProcessOrder(order: any, currentStatus: OrderStatus): boolean {
    // Add business logic to determine if order should be processed
    // For example, check if enough time has passed, inventory is available, etc.
    const timeSinceCreation = Date.now() - order.createdAt.getTime();
    const minProcessingTime = currentStatus === OrderStatus.PENDING ? 5000 : 10000; // 5s for pending, 10s for confirmed

    return timeSinceCreation >= minProcessingTime;
  }

  private async simulateOrderProcessing(order: any, newStatus: OrderStatus): Promise<void> {
    this.logger.log(`Processing order ${order.id} from ${order.status} to ${newStatus}`);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update order status
    order.changeStatus(newStatus);

    // Save the updated order
    await firstValueFrom(this.orderRepository.save(order));

    this.logger.log(`Order ${order.id} processed successfully to ${newStatus}`);
  }
}
