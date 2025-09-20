import { Money } from '../value-objects/money';
import * as crypto from 'crypto';

export class Product {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _description: string;
  private readonly _price: Money;
  private readonly _sku: string;
  private _stock: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    name: string,
    description: string,
    price: Money,
    sku: string,
    stock: number,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._price = price;
    this._sku = sku;
    this._stock = stock;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();

    this.validateBusinessRules();
  }

  static create(
    name: string,
    description: string,
    price: Money,
    sku: string,
    stock: number,
  ): Product {
    const id = crypto.randomUUID();
    return new Product(id, name, description, price, sku, stock);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get price(): Money {
    return this._price;
  }

  get sku(): string {
    return this._sku;
  }

  get stock(): number {
    return this._stock;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateStock(newStock: number): void {
    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }
    this._stock = newStock;
    this._updatedAt = new Date();
  }

  reduceStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (this._stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${this._stock}, Required: ${quantity}`);
    }
    this._stock -= quantity;
    this._updatedAt = new Date();
  }

  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this._stock += quantity;
    this._updatedAt = new Date();
  }

  isAvailable(): boolean {
    return this._stock > 0;
  }

  hasStock(quantity: number): boolean {
    return this._stock >= quantity;
  }

  private validateBusinessRules(): void {
    if (!this._id) {
      throw new Error('Product ID is required');
    }

    if (!this._name || this._name.trim() === '') {
      throw new Error('Product name is required');
    }

    if (this._name.trim().length < 2) {
      throw new Error('Product name must be at least 2 characters long');
    }

    if (this._name.trim().length > 255) {
      throw new Error('Product name must not exceed 255 characters');
    }

    if (!this._description || this._description.trim() === '') {
      throw new Error('Product description is required');
    }

    if (this._description.trim().length > 1000) {
      throw new Error('Product description must not exceed 1000 characters');
    }

    if (!this._price) {
      throw new Error('Product price is required');
    }

    if (!this._sku || this._sku.trim() === '') {
      throw new Error('Product SKU is required');
    }

    if (this._sku.trim().length < 3) {
      throw new Error('Product SKU must be at least 3 characters long');
    }

    if (this._sku.trim().length > 50) {
      throw new Error('Product SKU must not exceed 50 characters');
    }

    if (this._stock < 0) {
      throw new Error('Product stock cannot be negative');
    }
  }
}
