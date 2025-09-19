import { Email } from '../value-objects/email';

export class User {
  private readonly _id: string;
  private readonly _email: Email;
  private readonly _name: string;
  private readonly _createdAt: Date;

  constructor(id: string, email: Email, name: string, createdAt?: Date) {
    this._id = id;
    this._email = email;
    this._name = name;
    this._createdAt = createdAt || new Date();

    this.validateBusinessRules();
  }

  static create(email: Email, name: string): User {
    const id = crypto.randomUUID();
    return new User(id, email, name);
  }

  get id(): string {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private validateBusinessRules(): void {
    if (!this._id) {
      throw new Error('User ID is required');
    }

    if (!this._email) {
      throw new Error('User email is required');
    }

    if (!this._name || this._name.trim().length === 0) {
      throw new Error('User name is required');
    }

    if (this._name.trim().length < 2) {
      throw new Error('User name must be at least 2 characters long');
    }

    if (this._name.trim().length > 100) {
      throw new Error('User name must not exceed 100 characters');
    }
  }
}
