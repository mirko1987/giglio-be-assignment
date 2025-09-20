import { Product } from './product.entity';
import { Money } from '../value-objects/money';

export class OrderItem {
  private readonly _id: string;
  private readonly _product: Product;
  private readonly _quantity: number;
  private readonly _unitPrice: Money;

  constructor(id: string, product: Product, quantity: number, unitPrice: Money) {
    this._id = id;
    this._product = product;
    this._quantity = quantity;
    this._unitPrice = unitPrice;

    this.validateBusinessRules();
  }

  static create(product: Product, quantity: number, unitPrice: Money): OrderItem {
    const id = `${product.id}-${Date.now()}`;
    return new OrderItem(id, product, quantity, unitPrice);
  }

  get id(): string {
    return this._id;
  }

  get product(): Product {
    return this._product;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  getSubtotal(): Money {
    return this._unitPrice.multiply(this._quantity);
  }

  private validateBusinessRules(): void {
    if (!this._id) {
      throw new Error('Order item ID is required');
    }

    if (!this._product) {
      throw new Error('Product is required');
    }

    if (this._quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    if (!this._unitPrice || this._unitPrice.amount <= 0) {
      throw new Error('Unit price must be greater than zero');
    }

    if (this._unitPrice.currency !== this._product.price.currency) {
      throw new Error('Unit price currency must match product price currency');
    }
  }
}
