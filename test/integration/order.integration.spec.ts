import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from '../test-app.module';

describe('Order Integration Tests (e2e)', () => {
  let app: INestApplication;
  let userId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
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

    await app.init();

    // Create test data
    await createTestData();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  async function createTestData() {
    // Create test user
    const userResponse = await request(app.getHttpServer()).post('/users').send({
      name: 'Test User',
      email: 'test@example.com',
    });

    userId = userResponse.body.userId; // Fixed: API returns 'userId', not 'id'

    // Create test product
    const productResponse = await request(app.getHttpServer()).post('/products').send({
      name: 'Test Product',
      description: 'Test Description',
      price: 29.99,
      currency: 'USD',
      sku: 'TEST-SKU-001',
      stock: 10,
    });

    productId = productResponse.body.productId; // Fixed: API returns 'productId', not 'id'

    // Create initial order for tests
    const orderResponse = await request(app.getHttpServer()).post('/orders').send({
      userId,
      items: [
        {
          productId,
          quantity: 1,
          unitPrice: 29.99,
          currency: 'USD',
        },
      ],
    });

    orderId = orderResponse.body.orderId; // Store orderId for subsequent tests
  }

  describe('POST /orders', () => {
    it('should create an order successfully', async () => {
      const orderData = {
        userId,
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
      expect(response.body.userId).toBe(userId);
      expect(response.body.totalAmount).toBe(59.98); // Fixed: API returns number, not string
      expect(response.body.status).toBe('PENDING');
    });

    it('should return 400 for invalid order data', async () => {
      const invalidOrderData = {
        userId: 'invalid-uuid',
        items: [],
      };

      await request(app.getHttpServer()).post('/orders').send(invalidOrderData).expect(400);
    });

    it('should return 404 for non-existent customer', async () => {
      const orderData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            productId,
            quantity: 2,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      // Test application properly returns 404 for non-existent user
      const response = await request(app.getHttpServer()).post('/orders').send(orderData).expect(404);
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('GET /orders/:id', () => {
    let orderId: string;

    beforeEach(async () => {
      const orderData = {
        userId,
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      const response = await request(app.getHttpServer()).post('/orders').send(orderData);

      orderId = response.body.orderId;
    });

    it('should get an order by ID', async () => {
      const response = await request(app.getHttpServer()).get(`/orders/${orderId}`).expect(200);

      expect(response.body.orderId).toBe(orderId);
      expect(response.body.userId).toBe(userId);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.totalAmount).toBe(29.99); // Fixed: API returns number, not string
    });

    it('should return 404 for non-existent order', async () => {
      // Test application properly returns 404 for non-existent order
      const response = await request(app.getHttpServer())
        .get('/orders/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);
      expect(response.body.message).toContain('Order not found');
    });
  });

  describe('GET /orders', () => {
    beforeEach(async () => {
      // Create multiple orders for testing
      const orderData = {
        userId,
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      await request(app.getHttpServer()).post('/orders').send(orderData);

      await request(app.getHttpServer()).post('/orders').send(orderData);
    });

    it('should list all orders', async () => {
      const response = await request(app.getHttpServer()).get('/orders').expect(200);

      expect(response.body.orders).toBeDefined();
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should filter orders by user ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders?userId=${userId}`)
        .expect(200);

      expect(response.body.orders).toBeDefined();
      response.body.orders.forEach((order: any) => {
        expect(order.userId).toBe(userId);
      });
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer()).get('/orders?status=PENDING').expect(200);

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
        userId,
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 29.99,
            currency: 'USD',
          },
        ],
      };

      const response = await request(app.getHttpServer()).post('/orders').send(orderData);

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
      // Test application properly returns 404 for non-existent order
      const response = await request(app.getHttpServer())
        .put('/orders/123e4567-e89b-12d3-a456-426614174000/status')
        .send({ newStatus: 'CONFIRMED' })
        .expect(404);
      expect(response.body.message).toContain('Order not found');
    });
  });
});
