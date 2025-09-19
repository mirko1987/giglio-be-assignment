import { Observable } from 'rxjs';

export interface NotificationPort {
  sendOrderConfirmation(customerEmail: string, orderId: string): Observable<void>;
  sendOrderStatusUpdate(customerEmail: string, orderId: string, status: string): Observable<void>;
  sendOrderCancellation(customerEmail: string, orderId: string): Observable<void>;
}

