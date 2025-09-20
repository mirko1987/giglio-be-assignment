import { Order } from '../../../../src/domain/entities/order.entity';
import { User } from '../../../../src/domain/entities/user.entity';
import { Product } from '../../../../src/domain/entities/product.entity';
import { OrderItem } from '../../../../src/domain/entities/order-item.entity';
import { OrderStatus } from '../../../../src/domain/value-objects/order-status';
import { Money } from '../../../../src/domain/value-objects/money';
import { Email } from '../../../../src/domain/value-objects/email';

describe('Order Entity', () => {
  let user: User;
  let product: Product;
  let orderItem: OrderItem;
  let order: Order;

  beforeEach(() => {
    user = User.create(new Email('test@example.com'), 'Test Customer');
    product = Product.create(
      'Test Product',
      'Test Description',
      new Money(29.99, 'USD'),
      'TEST-SKU-001',
      10,
    );
    orderItem = OrderItem.create(product, 2, new Money(29.99, 'USD'));
    order = Order.create(user, [orderItem]);
  });

  describe('Order Creation', () => {
    it('should create an order with valid data', () => {
      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.user).toBe(user);
      expect(order.items).toHaveLength(1);
      expect(order.status.value).toBe(OrderStatus.PENDING);
      expect(order.getTotalAmount().amount).toBe(59.98);
    });

    it('should throw error when creating order without user', () => {
      expect(() => {
        new Order('test-id', null as any, [orderItem]);
      }).toThrow('Order user is required');
    });

    it('should throw error when creating order without items', () => {
      expect(() => {
        new Order('test-id', user, []);
      }).toThrow('Order must have at least one item');
    });

    it('should throw error when creating order with null items', () => {
      expect(() => {
        new Order('test-id', user, null as any);
      }).toThrow('Order must have at least one item');
    });
  });

  describe('Order Status Management', () => {
    it('should change status from PENDING to CONFIRMED', () => {
      order.changeStatus(OrderStatus.CONFIRMED);
      expect(order.status.value).toBe(OrderStatus.CONFIRMED);
    });

    it('should not allow invalid status transitions', () => {
      expect(() => {
        order.changeStatus(OrderStatus.DELIVERED);
      }).toThrow('Cannot transition from PENDING to DELIVERED');
    });

    it('should allow cancellation when status is PENDING', () => {
      expect(order.canBeCancelled()).toBe(true);
      order.cancel();
      expect(order.status.value).toBe(OrderStatus.CANCELLED);
    });

    it('should allow cancellation when status is CONFIRMED', () => {
      order.changeStatus(OrderStatus.CONFIRMED);
      expect(order.canBeCancelled()).toBe(true);
      order.cancel();
      expect(order.status.value).toBe(OrderStatus.CANCELLED);
    });

    it('should not allow cancellation when status is SHIPPED', () => {
      // First transition to SHIPPED through valid states
      order.changeStatus(OrderStatus.CONFIRMED);
      order.changeStatus(OrderStatus.PROCESSING);
      order.changeStatus(OrderStatus.PAID);
      order.changeStatus(OrderStatus.SHIPPED);
      expect(order.canBeCancelled()).toBe(false);
      expect(() => order.cancel()).toThrow();
    });

    it('should allow completion when status is SHIPPED', () => {
      // First transition to SHIPPED through valid states
      order.changeStatus(OrderStatus.CONFIRMED);
      order.changeStatus(OrderStatus.PROCESSING);
      order.changeStatus(OrderStatus.PAID);
      order.changeStatus(OrderStatus.SHIPPED);
      expect(order.canBeCompleted()).toBe(true);
      order.complete();
      expect(order.status.value).toBe(OrderStatus.DELIVERED);
    });

    it('should not allow completion when status is PENDING', () => {
      expect(order.canBeCompleted()).toBe(false);
      expect(() => order.complete()).toThrow('Order cannot be completed in PENDING status');
    });
  });

  describe('Order Calculations', () => {
    it('should calculate total amount correctly', () => {
      const total = order.getTotalAmount();
      expect(total.amount).toBe(59.98);
      expect(total.currency).toBe('USD');
    });

    it('should calculate total items correctly', () => {
      const totalItems = order.items.reduce((total, item) => total + item.quantity, 0);
      expect(totalItems).toBe(2);
    });

    it('should calculate total with multiple items', () => {
      const product2 = Product.create(
        'Test Product 2',
        'Test Description 2',
        new Money(19.99, 'USD'),
        'TEST-SKU-002',
        5,
      );
      const orderItem2 = OrderItem.create(product2, 1, new Money(19.99, 'USD'));
      const multiItemOrder = Order.create(user, [orderItem, orderItem2]);

      expect(multiItemOrder.getTotalAmount().amount).toBe(79.97);
      expect(multiItemOrder.items.reduce((total, item) => total + item.quantity, 0)).toBe(3);
    });
  });

  describe('Domain Events', () => {
    it('should generate OrderCreated event on creation', () => {
      const events = order.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('OrderCreated');
    });

    it('should generate OrderStatusChanged event on status change', () => {
      order.clearDomainEvents(); // Clear initial events
      order.changeStatus(OrderStatus.CONFIRMED);

      const events = order.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('OrderStatusChanged');
    });

    it('should clear domain events', () => {
      expect(order.domainEvents).toHaveLength(1);
      order.clearDomainEvents();
      expect(order.domainEvents).toHaveLength(0);
    });
  });
});
