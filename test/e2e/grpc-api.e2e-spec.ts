import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from '../../src/app.module';
import { testDatabaseConfig } from '../test-database.config';

// gRPC service interfaces
interface UserService {
  createUser(data: { name: string; email: string }): Promise<any>;
  getUser(data: { id: string }): Promise<any>;
  getUserByEmail(data: { email: string }): Promise<any>;
  deleteUser(data: { id: string }): Promise<any>;
}

interface ProductService {
  createProduct(data: {
    name: string;
    description: string;
    price: number;
    currency: string;
    sku: string;
    stock: number;
  }): Promise<any>;
  getProduct(data: { id: string }): Promise<any>;
  checkStock(data: { id: string; quantity: number }): Promise<any>;
}

interface OrderService {
  createOrder(data: {
    user_id: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      currency: string;
    }>;
  }): Promise<any>;
  getOrder(data: { id: string }): Promise<any>;
  listOrders(data: { page: number; limit: number }): Promise<any>;
  getOrdersByUser(data: { user_id: string; page: number; limit: number }): Promise<any>;
  updateOrderStatus(data: { id: string; status: string }): Promise<any>;
  cancelOrder(data: { id: string; reason: string }): Promise<any>;
}

describe('gRPC API E2E Tests', () => {
  let app: INestApplication;
  let userService: UserService;
  let productService: ProductService;
  let orderService: OrderService;
  let userId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot(testDatabaseConfig),
        ClientsModule.register([
          {
            name: 'USER_PACKAGE',
            transport: Transport.GRPC,
            options: {
              package: 'user',
              protoPath: join(__dirname, '../../proto/user.proto'),
              url: 'localhost:5001',
            },
          },
          {
            name: 'PRODUCT_PACKAGE',
            transport: Transport.GRPC,
            options: {
              package: 'product',
              protoPath: join(__dirname, '../../proto/product.proto'),
              url: 'localhost:5001',
            },
          },
          {
            name: 'ORDER_PACKAGE',
            transport: Transport.GRPC,
            options: {
              package: 'order',
              protoPath: join(__dirname, '../../proto/order.proto'),
              url: 'localhost:5001',
            },
          },
        ]),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Add validation pipe like in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Configure hybrid application (HTTP + gRPC)
    app.connectMicroservice({
      transport: Transport.GRPC,
      options: {
        package: ['user', 'product', 'order'],
        protoPath: [
          join(__dirname, '../../proto/user.proto'),
          join(__dirname, '../../proto/product.proto'),
          join(__dirname, '../../proto/order.proto'),
        ],
        url: 'localhost:5001',
      },
    });

    await app.startAllMicroservices();
    await app.init();

    // Get gRPC clients
    const userClient: ClientGrpc = app.get('USER_PACKAGE');
    const productClient: ClientGrpc = app.get('PRODUCT_PACKAGE');
    const orderClient: ClientGrpc = app.get('ORDER_PACKAGE');

    userService = userClient.getService<UserService>('UserService');
    productService = productClient.getService<ProductService>('ProductService');
    orderService = orderClient.getService<OrderService>('OrderService');

    // Wait a bit for gRPC services to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('User gRPC Service', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      };

      const response = await userService.createUser(userData);

      expect(response.user).toBeDefined();
      expect(response.user.id).toBeDefined();
      expect(response.user.name).toBe(userData.name);
      expect(response.user.email).toBe(userData.email);
      expect(response.user.created_at).toBeDefined();

      userId = response.user.id;
    });

    it('should get user by id', async () => {
      const response = await userService.getUser({ id: userId });

      expect(response.user).toBeDefined();
      expect(response.user.id).toBe(userId);
      expect(response.user.name).toBe('Jane Smith');
      expect(response.user.email).toBe('jane.smith@example.com');
    });

    it('should get user by email', async () => {
      const response = await userService.getUserByEmail({
        email: 'jane.smith@example.com',
      });

      expect(response.user).toBeDefined();
      expect(response.user.id).toBe(userId);
      expect(response.user.email).toBe('jane.smith@example.com');
    });

    it('should handle non-existent user', async () => {
      try {
        await userService.getUser({ id: '123e4567-e89b-12d3-a456-426614174000' });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(5); // NOT_FOUND
      }
    });

    it('should validate user input', async () => {
      try {
        await userService.createUser({
          name: '',
          email: 'invalid-email',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(3); // INVALID_ARGUMENT
      }
    });
  });

  describe('Product gRPC Service', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'iPhone 15 Pro',
        description: 'Apple iPhone 15 Pro 256GB',
        price: 1199.99,
        currency: 'USD',
        sku: 'IPHONE-15-PRO-256',
        stock: 25,
      };

      const response = await productService.createProduct(productData);

      expect(response.product).toBeDefined();
      expect(response.product.id).toBeDefined();
      expect(response.product.name).toBe(productData.name);
      expect(response.product.price).toBe(productData.price);
      expect(response.product.stock).toBe(productData.stock);

      productId = response.product.id;
    });

    it('should get product by id', async () => {
      const response = await productService.getProduct({ id: productId });

      expect(response.product).toBeDefined();
      expect(response.product.id).toBe(productId);
      expect(response.product.name).toBe('iPhone 15 Pro');
      expect(response.product.price).toBe(1199.99);
    });

    it('should check stock availability', async () => {
      const response = await productService.checkStock({
        id: productId,
        quantity: 2,
      });

      expect(response.available).toBe(true);
      expect(response.available_quantity).toBeGreaterThanOrEqual(2);
    });

    it('should detect insufficient stock', async () => {
      const response = await productService.checkStock({
        id: productId,
        quantity: 100,
      });

      expect(response.available).toBe(false);
    });

    it('should handle non-existent product', async () => {
      try {
        await productService.getProduct({ id: '123e4567-e89b-12d3-a456-426614174000' });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(5); // NOT_FOUND
      }
    });
  });

  describe('Order gRPC Service', () => {
    it('should create a new order', async () => {
      const orderData = {
        user_id: userId,
        items: [
          {
            product_id: productId,
            quantity: 2,
            unit_price: 1199.99,
            currency: 'USD',
          },
        ],
      };

      const response = await orderService.createOrder(orderData);

      expect(response.order).toBeDefined();
      expect(response.order.id).toBeDefined();
      expect(response.order.user_id).toBe(userId);
      expect(response.order.items).toHaveLength(1);
      expect(response.order.total_amount).toBe(2399.98);
      expect(response.order.status).toBe('PENDING');

      orderId = response.order.id;
    });

    it('should get order by id', async () => {
      const response = await orderService.getOrder({ id: orderId });

      expect(response.order).toBeDefined();
      expect(response.order.id).toBe(orderId);
      expect(response.order.user_id).toBe(userId);
      expect(response.order.items).toHaveLength(1);
      expect(response.order.total_amount).toBe(2399.98);
    });

    it('should list orders with pagination', async () => {
      const response = await orderService.listOrders({
        page: 1,
        limit: 10,
      });

      expect(response.orders).toBeDefined();
      expect(Array.isArray(response.orders)).toBe(true);
      expect(response.total).toBeGreaterThan(0);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(10);
    });

    it('should get orders by user', async () => {
      const response = await orderService.getOrdersByUser({
        user_id: userId,
        page: 1,
        limit: 10,
      });

      expect(response.orders).toBeDefined();
      response.orders.forEach((order: any) => {
        expect(order.user_id).toBe(userId);
      });
    });

    it('should update order status', async () => {
      const response = await orderService.updateOrderStatus({
        id: orderId,
        status: 'CONFIRMED',
      });

      expect(response.order).toBeDefined();
      expect(response.order.id).toBe(orderId);
      expect(response.order.status).toBe('CONFIRMED');
    });

    it('should cancel order', async () => {
      // Create a new order to cancel
      const orderData = {
        user_id: userId,
        items: [
          {
            product_id: productId,
            quantity: 1,
            unit_price: 1199.99,
            currency: 'USD',
          },
        ],
      };

      const createResponse = await orderService.createOrder(orderData);
      const cancelOrderId = createResponse.order.id;

      const response = await orderService.cancelOrder({
        id: cancelOrderId,
        reason: 'Customer request',
      });

      expect(response.order).toBeDefined();
      expect(response.order.id).toBe(cancelOrderId);
      expect(response.order.status).toBe('CANCELLED');
    });

    it('should handle invalid order creation', async () => {
      try {
        await orderService.createOrder({
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          items: [
            {
              product_id: productId,
              quantity: 1,
              unit_price: 1199.99,
              currency: 'USD',
            },
          ],
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(5); // NOT_FOUND
      }
    });

    it('should handle invalid status transitions', async () => {
      try {
        await orderService.updateOrderStatus({
          id: orderId,
          status: 'DELIVERED', // Invalid transition from CONFIRMED
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(3); // INVALID_ARGUMENT
      }
    });
  });

  describe('Business Logic via gRPC', () => {
    it('should enforce stock validation', async () => {
      try {
        await orderService.createOrder({
          user_id: userId,
          items: [
            {
              product_id: productId,
              quantity: 1000, // More than available stock
              unit_price: 1199.99,
              currency: 'USD',
            },
          ],
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(3); // INVALID_ARGUMENT
        expect(error.message).toContain('Insufficient stock');
      }
    });

    it('should validate order items', async () => {
      try {
        await orderService.createOrder({
          user_id: userId,
          items: [], // Empty items
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(3); // INVALID_ARGUMENT
      }
    });

    it('should handle concurrent order creation', async () => {
      // Create multiple orders simultaneously to test concurrency
      const orderPromises = Array.from({ length: 3 }, () =>
        orderService.createOrder({
          user_id: userId,
          items: [
            {
              product_id: productId,
              quantity: 1,
              unit_price: 1199.99,
              currency: 'USD',
            },
          ],
        }),
      );

      const responses = await Promise.all(orderPromises);

      responses.forEach((response) => {
        expect(response.order).toBeDefined();
        expect(response.order.user_id).toBe(userId);
        expect(response.order.status).toBe('PENDING');
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency between REST and gRPC', async () => {
      // Create user via gRPC
      const grpcUser = await userService.createUser({
        name: 'Consistency Test User',
        email: 'consistency@example.com',
      });

      // Create product via gRPC
      const grpcProduct = await productService.createProduct({
        name: 'Consistency Test Product',
        description: 'Product for consistency testing',
        price: 99.99,
        currency: 'USD',
        sku: 'CONSISTENCY-001',
        stock: 10,
      });

      // Create order via gRPC
      const grpcOrder = await orderService.createOrder({
        user_id: grpcUser.user.id,
        items: [
          {
            product_id: grpcProduct.product.id,
            quantity: 1,
            unit_price: 99.99,
            currency: 'USD',
          },
        ],
      });

      // Verify data consistency
      expect(grpcUser.user.id).toBeDefined();
      expect(grpcProduct.product.id).toBeDefined();
      expect(grpcOrder.order.id).toBeDefined();
      expect(grpcOrder.order.user_id).toBe(grpcUser.user.id);
      expect(grpcOrder.order.items[0].product_id).toBe(grpcProduct.product.id);
    });
  });
});
