import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { Money } from '../value-objects/money';
import { OrderStatus, OrderStatusVO } from '../value-objects/order-status';
import * as crypto from 'crypto';

export class Order {
  private readonly _id: string;
  private readonly _user: User;
  private readonly _items: OrderItem[];
  private _status: OrderStatusVO;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: any[] = [];

  constructor(
    id: string,
    user: User,
    items: OrderItem[],
    status?: OrderStatusVO,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this._id = id;
    this._user = user;
    this._items = [...items];
    this._status = status || new OrderStatusVO(OrderStatus.PENDING);
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();

    this.validateBusinessRules();
  }

  static create(user: User, items: OrderItem[]): Order {
    const id = crypto.randomUUID();
    const order = new Order(id, user, items);
    
    // Add domain event
    order.addDomainEvent({
      type: 'OrderCreated',
      orderId: order._id,
      userId: user.id,
      totalAmount: order.getTotalAmount(),
      occurredAt: new Date()
    });

    return order;
  }

  get id(): string {
    return this._id;
  }

  get user(): User {
    return this._user;
  }

  get items(): OrderItem[] {
    return [...this._items];
  }

  get status(): OrderStatusVO {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get domainEvents(): any[] {
    return [...this._domainEvents];
  }

  getTotalAmount(): Money {
    if (this._items.length === 0) {
      return new Money(0, 'USD');
    }

    return this._items.reduce((total, item) => {
      return total.add(item.getSubtotal());
    }, new Money(0, this._items[0].unitPrice.currency));
  }

  changeStatus(newStatus: OrderStatus): void {
    const newStatusVO = new OrderStatusVO(newStatus);
    
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this._status.value} to ${newStatus}`);
    }

    const oldStatus = this._status.value;
    this._status = newStatusVO;
    this._updatedAt = new Date();

    // Add domain event
    this.addDomainEvent({
      type: 'OrderStatusChanged',
      orderId: this._id,
      oldStatus: oldStatus,
      newStatus: newStatus,
      occurredAt: new Date()
    });
  }

  addItem(item: OrderItem): void {
    // Check if item with same product already exists
    const existingItemIndex = this._items.findIndex(
      existingItem => existingItem.product.id === item.product.id
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const existingItem = this._items[existingItemIndex];
      const newQuantity = existingItem.quantity + item.quantity;
      const updatedItem = OrderItem.create(
        existingItem.product,
        newQuantity,
        existingItem.unitPrice
      );
      this._items[existingItemIndex] = updatedItem;
    } else {
      // Add new item
      this._items.push(item);
    }

    this._updatedAt = new Date();
  }

  removeItem(productId: string): void {
    const itemIndex = this._items.findIndex(item => item.product.id === productId);
    if (itemIndex === -1) {
      throw new Error(`Item with product ID ${productId} not found in order`);
    }

    this._items.splice(itemIndex, 1);
    this._updatedAt = new Date();
  }

  updateItemQuantity(productId: string, newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const itemIndex = this._items.findIndex(item => item.product.id === productId);
    if (itemIndex === -1) {
      throw new Error(`Item with product ID ${productId} not found in order`);
    }

    const existingItem = this._items[itemIndex];
    const updatedItem = OrderItem.create(
      existingItem.product,
      newQuantity,
      existingItem.unitPrice
    );
    this._items[itemIndex] = updatedItem;
    this._updatedAt = new Date();
  }

  canBeCancelled(): boolean {
    return this._status.value === OrderStatus.PENDING || 
           this._status.value === OrderStatus.CONFIRMED;
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error(`Order cannot be cancelled in ${this._status.value} status`);
    }
    this.changeStatus(OrderStatus.CANCELLED);
  }

  private addDomainEvent(event: any): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  private validateBusinessRules(): void {
    if (!this._id) {
      throw new Error('Order ID is required');
    }

    if (!this._user) {
      throw new Error('Order user is required');
    }

    if (!this._items || this._items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    if (this._items.length > 50) {
      throw new Error('Order cannot have more than 50 items');
    }

    // Validate all items have the same currency
    if (this._items.length > 1) {
      const firstCurrency = this._items[0].unitPrice.currency;
      const hasMultipleCurrencies = this._items.some(
        item => item.unitPrice.currency !== firstCurrency
      );
      
      if (hasMultipleCurrencies) {
        throw new Error('All order items must have the same currency');
      }
    }

    // Validate total amount doesn't exceed reasonable limits
    const totalAmount = this.getTotalAmount();
    if (totalAmount.amount > 1000000) {
      throw new Error('Order total amount cannot exceed 1,000,000');
    }
  }
}
