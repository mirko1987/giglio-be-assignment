import { Injectable, Logger } from '@nestjs/common';
import { Observable, of, throwError, timer } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { NotificationPort } from '../../application/ports/notification.port';

@Injectable()
export class NotificationAdapter implements NotificationPort {
  private readonly logger = new Logger(NotificationAdapter.name);

  sendOrderConfirmation(customerEmail: string, orderId: string): Observable<void> {
    this.logger.log(`Sending order confirmation email to ${customerEmail} for order ${orderId}`);
    
    // Simulate email sending
    return this.simulateEmailSending('Order Confirmation', customerEmail, orderId).pipe(
      tap(() => {
        this.logger.log(`Order confirmation email sent successfully to ${customerEmail}`);
      }),
      catchError(error => {
        this.logger.error(`Failed to send order confirmation email to ${customerEmail}`, error);
        return throwError(() => new Error(`Failed to send order confirmation email: ${error.message}`));
      })
    );
  }

  sendOrderStatusUpdate(customerEmail: string, orderId: string, status: string): Observable<void> {
    this.logger.log(`Sending order status update email to ${customerEmail} for order ${orderId} with status ${status}`);
    
    // Simulate email sending
    return this.simulateEmailSending('Order Status Update', customerEmail, orderId, status).pipe(
      tap(() => {
        this.logger.log(`Order status update email sent successfully to ${customerEmail}`);
      }),
      catchError(error => {
        this.logger.error(`Failed to send order status update email to ${customerEmail}`, error);
        return throwError(() => new Error(`Failed to send order status update email: ${error.message}`));
      })
    );
  }

  sendOrderCancellation(customerEmail: string, orderId: string): Observable<void> {
    this.logger.log(`Sending order cancellation email to ${customerEmail} for order ${orderId}`);
    
    // Simulate email sending
    return this.simulateEmailSending('Order Cancellation', customerEmail, orderId).pipe(
      tap(() => {
        this.logger.log(`Order cancellation email sent successfully to ${customerEmail}`);
      }),
      catchError(error => {
        this.logger.error(`Failed to send order cancellation email to ${customerEmail}`, error);
        return throwError(() => new Error(`Failed to send order cancellation email: ${error.message}`));
      })
    );
  }

  private simulateEmailSending(
    subject: string, 
    email: string, 
    orderId: string, 
    status?: string
  ): Observable<void> {
    return timer(100).pipe(
      map(() => {
        this.logger.log(`Email sent - Subject: ${subject}, To: ${email}, Order: ${orderId}${status ? `, Status: ${status}` : ''}`);
      })
    );
  }
}

