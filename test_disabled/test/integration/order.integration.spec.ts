import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { OrderOrmEntity } from '../../src/infrastructure/database/entities/order.orm-entity';
import { OrderItemOrmEntity } from '../../src/infrastructure/database/entities/order-item.orm-entity';
import { UserOrmEntity } from '../../src/infrastructure/database/entities/user.orm-entity';
import { ProductOrmEntity } from '../../src/infrastructure/database/entities/product.orm-entity';

describe('Order Integration Tests (e2e)', () => {
  let app: INestApplication;
  let customerId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [OrderOrmEntity, OrderItemOrmEntity, UserOrmEntity, ProductOrmEntity],
          synchronize: true,
          logging: false,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test data
    await createTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createTestData() {
    // Create test customer
    const customerResponse = await request(app.getHttpServer())
      .post('/customers')
      .send({
        name: 'Test Customer',
        email: 'test@example.com',
      });

    customerId = customerResponse.body.customerId;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        currency: 'USD',
        sku: 'TEST-SKU-001',
        stock: 10,
      });

    productId = productResponse.body.productId;
  }

  describe('POST /orders', () => {
    it('should create an order successfully', async () => {
      const orderData = {
        customerId,
        items: [
          {
            productId,
            quantity: 2,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('orderId');
      expect(response.body.customerId).toBe(customerId);
      expect(response.body.totalAmount).toBe('USD 59.98');
      expect(response.body.status).toBe('PENDING');
    });

    it('should return 400 for invalid order data', async () => {
      const invalidOrderData = {
        customerId: 'invalid-uuid',
        items: [],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(invalidOrderData)
        .expect(400);
    });

    it('should return 404 for non-existent customer', async () => {
      const orderData = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            productId,
            quantity: 2,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(orderData)
        .expect(404);
    });
  });

  describe('GET /orders/:id', () => {
    let orderId: string;

    beforeEach(async () => {
      const orderData = {
        customerId,
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(orderData);

      orderId = response.body.orderId;
    });

    it('should get an order by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(200);

      expect(response.body.orderId).toBe(orderId);
      expect(response.body.customerId).toBe(customerId);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.totalAmount).toBe('USD 29.99');
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/orders/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);
    });
  });

  describe('GET /orders', () => {
    beforeEach(async () => {
      // Create multiple orders for testing
      const orderData = {
        customerId,
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(orderData);

      await request(app.getHttpServer())
        .post('/orders')
        .send(orderData);
    });

    it('should list all orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      expect(response.body.orders).toBeDefined();
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should filter orders by customer ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders?customerId=${customerId}`)
        .expect(200);

      expect(response.body.orders).toBeDefined();
      response.body.orders.forEach((order: any) => {
        expect(order.customerId).toBe(customerId);
      });
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders?status=PENDING')
        .expect(200);

      expect(response.body.orders).toBeDefined();
      response.body.orders.forEach((order: any) => {
        expect(order.status).toBe('PENDING');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders?limit=1&offset=0')
        .expect(200);

      expect(response.body.orders).toHaveLength(1);
      expect(response.body.limit).toBe(1);
      expect(response.body.offset).toBe(0);
    });
  });

  describe('PUT /orders/:id/status', () => {
    let orderId: string;

    beforeEach(async () => {
      const orderData = {
        customerId,
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(orderData);

      orderId = response.body.orderId;
    });

    it('should update order status successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`/orders/${orderId}/status`)
        .send({ newStatus: 'CONFIRMED' })
        .expect(200);

      expect(response.body.message).toBe('Order status updated successfully');
      expect(response.body.orderId).toBe(orderId);
      expect(response.body.newStatus).toBe('CONFIRMED');
    });

    it('should return 400 for invalid status transition', async () => {
      await request(app.getHttpServer())
        .put(`/orders/${orderId}/status`)
        .send({ newStatus: 'COMPLETED' })
        .expect(400);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .put('/orders/123e4567-e89b-12d3-a456-426614174000/status')
        .send({ newStatus: 'CONFIRMED' })
        .expect(404);
    });
  });
});
