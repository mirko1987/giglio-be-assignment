import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderUseCase } from '../../../../src/application/use-cases/create-order.use-case';
import { OrderRepositoryPort } from '../../../../src/application/ports/order.repository.port';
import { UserRepositoryPort } from '../../../../src/application/ports/user.repository.port';
import { ProductRepositoryPort } from '../../../../src/application/ports/product.repository.port';
import { EventPublisherPort } from '../../../../src/application/ports/event-publisher.port';
import { NotificationPort } from '../../../../src/application/ports/notification.port';
import { Order } from '../../../../src/domain/entities/order.entity';
import { User } from '../../../../src/domain/entities/user.entity';
import { Product } from '../../../../src/domain/entities/product.entity';
import { OrderItem } from '../../../../src/domain/entities/order-item.entity';
import { Money } from '../../../../src/domain/value-objects/money';
import { Email } from '../../../../src/domain/value-objects/email';
import { of } from 'rxjs';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepository: jest.Mocked<OrderRepositoryPort>;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let productRepository: jest.Mocked<ProductRepositoryPort>;
  let eventPublisher: jest.Mocked<EventPublisherPort>;
  let notificationService: jest.Mocked<NotificationPort>;

  beforeEach(async () => {
    const mockOrderRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByStatus: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    const mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    const mockProductRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findBySku: jest.fn(),
      findAll: jest.fn(),
      findByAvailability: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    const mockEventPublisher = {
      publish: jest.fn(),
      publishMany: jest.fn(),
    };

    const mockNotificationService = {
      sendOrderConfirmation: jest.fn(),
      sendOrderStatusUpdate: jest.fn(),
      sendOrderCancellation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        {
          provide: 'OrderRepositoryPort',
          useValue: mockOrderRepository,
        },
        {
          provide: 'UserRepositoryPort',
          useValue: mockUserRepository,
        },
        {
          provide: 'ProductRepositoryPort',
          useValue: mockProductRepository,
        },
        {
          provide: 'EventPublisherPort',
          useValue: mockEventPublisher,
        },
        {
          provide: 'NotificationPort',
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
    orderRepository = module.get('OrderRepositoryPort');
    userRepository = module.get('UserRepositoryPort');
    productRepository = module.get('ProductRepositoryPort');
    eventPublisher = module.get('EventPublisherPort');
    notificationService = module.get('NotificationPort');
  });

  describe('execute', () => {
    it('should create an order successfully', (done) => {
      // Arrange
      const user = User.create(new Email('test@example.com'), 'Test Customer');
      const product = Product.create(
        'Test Product',
        'Test Description',
        new Money(29.99, 'USD'),
        'TEST-SKU-001',
        10,
      );
      const orderItem = OrderItem.create(product, 2, new Money(29.99, 'USD'));
      const order = Order.create(user, [orderItem]);

      const request = {
        userId: user.id,
        items: [
          {
            productId: product.id,
            quantity: 2,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      userRepository.findById.mockReturnValue(of(user));
      productRepository.findById.mockReturnValue(of(product));
      orderRepository.save.mockReturnValue(of(order));
      eventPublisher.publishMany.mockReturnValue(of(void 0));
      notificationService.sendOrderConfirmation.mockReturnValue(of(void 0));

      // Act
      useCase.execute(request).subscribe({
        next: (response) => {
          // Assert
          expect(response.orderId).toBe(order.id);
          expect(response.userId).toBe(user.id);
          expect(response.totalAmount).toBe(59.98);
          expect(response.status).toBe('PENDING');
          expect(userRepository.findById).toHaveBeenCalledWith(user.id);
          expect(productRepository.findById).toHaveBeenCalledWith(product.id);
          expect(orderRepository.save).toHaveBeenCalled();
          expect(eventPublisher.publishMany).toHaveBeenCalled();
          expect(notificationService.sendOrderConfirmation).toHaveBeenCalledWith(
            user.email.value,
            order.id,
          );
          done();
        },
        error: done,
      });
    });

    it('should throw error when customer not found', (done) => {
      // Arrange
      const request = {
        userId: 'non-existent-customer-id',
        items: [
          {
            productId: 'product-id',
            quantity: 2,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      userRepository.findById.mockReturnValue(of(null));

      // Act
      useCase.execute(request).subscribe({
        next: () => done(new Error('Should have thrown an error')),
        error: (error) => {
          // Assert
          expect(error.message).toContain('User with ID non-existent-customer-id not found');
          done();
        },
      });
    });

    it('should throw error when product not found', (done) => {
      // Arrange
      const user = User.create(new Email('test@example.com'), 'Test Customer');
      const request = {
        userId: user.id,
        items: [
          {
            productId: 'non-existent-product-id',
            quantity: 2,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      userRepository.findById.mockReturnValue(of(user));
      productRepository.findById.mockReturnValue(of(null));

      // Act
      useCase.execute(request).subscribe({
        next: () => done(new Error('Should have thrown an error')),
        error: (error) => {
          // Assert
          expect(error.message).toContain('Product with ID non-existent-product-id not found');
          done();
        },
      });
    });

    it('should throw error when insufficient stock', (done) => {
      // Arrange
      const user = User.create(new Email('test@example.com'), 'Test Customer');
      const product = Product.create(
        'Test Product',
        'Test Description',
        new Money(29.99, 'USD'),
        'TEST-SKU-001',
        1, // Only 1 in stock
      );
      const request = {
        userId: user.id,
        items: [
          {
            productId: product.id,
            quantity: 2, // Requesting 2
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      userRepository.findById.mockReturnValue(of(user));
      productRepository.findById.mockReturnValue(of(product));

      // Act
      useCase.execute(request).subscribe({
        next: () => done(new Error('Should have thrown an error')),
        error: (error) => {
          // Assert
          expect(error.message).toContain('Insufficient stock');
          done();
        },
      });
    });

    it('should throw error when order has no items', (done) => {
      // Arrange
      const user = User.create(new Email('test@example.com'), 'Test User');
      const request = {
        userId: user.id,
        items: [],
      };

      // Mock setup - user exists but items array is empty
      userRepository.findById.mockReturnValue(of(user));

      // Act
      useCase.execute(request).subscribe({
        next: () => done(new Error('Should have thrown an error')),
        error: (error) => {
          // Assert
          expect(error.message).toContain('Order must have at least one item');
          done();
        },
      });
    });
  });
});
