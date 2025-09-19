# NestJS Order System

A comprehensive order management system built with **NestJS**, implementing **Hexagonal Architecture**, **SOLID Principles**, **RxJS**, and industry best practices.

## 🏗️ Architecture Overview

This project follows **Hexagonal Architecture** (Ports and Adapters) pattern, ensuring clean separation of concerns and high testability:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Controllers   │  │      DTOs       │  │   Swagger    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Use Cases     │  │     Ports       │  │   Services   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    Entities     │  │  Value Objects  │  │    Events    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Repositories  │  │    Services     │  │   Database   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Features

- **Hexagonal Architecture**: Clean separation between business logic and external concerns
- **SOLID Principles**: Maintainable, extensible, and testable code
- **RxJS Integration**: Reactive programming for async operations and event handling
- **Domain-Driven Design**: Rich domain models with business rules
- **Event-Driven Architecture**: Domain events for loose coupling
- **Comprehensive Testing**: Unit, integration, and e2e tests
- **API Documentation**: Auto-generated Swagger documentation
- **Type Safety**: Full TypeScript implementation

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nestjs-order-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your database configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=order_system
   NODE_ENV=development
   PORT=3000
   ```

4. **Database Setup**
   ```bash
   # Create the database
   createdb order_system
   
   # Run migrations (if any)
   npm run migration:run
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start:prod
   ```

The application will be available at:
- **HTTP API**: `http://localhost:3000`
- **gRPC API**: `localhost:5000`
- **API Documentation**: `http://localhost:3000/api/docs`

## 📚 API Documentation

### gRPC Services

This application provides **complete gRPC CRUD operations** for all entities as required:

- **UserService**: Create, Read, Update, Delete users
- **ProductService**: Create, Read, Update, Delete products + Stock checking
- **OrderService**: Create, Read, Update, Delete orders + Status management

**📋 For detailed gRPC testing instructions, see [GRPC_TESTING.md](./GRPC_TESTING.md)**

### REST API (HTTP)

### Orders

#### Create Order
```http
POST /orders
Content-Type: application/json

{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "unitPrice": 29.99,
      "currency": "USD"
    }
  ]
}
```

#### Get Order
```http
GET /orders/{id}
```

#### List Orders
```http
GET /orders?customerId={id}&status={status}&limit={limit}&offset={offset}
```

#### Update Order Status
```http
PUT /orders/{id}/status
Content-Type: application/json

{
  "newStatus": "CONFIRMED"
}
```

### Order Status Flow

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
    ↓         ↓           ↓          ↓
CANCELLED  CANCELLED  CANCELLED  CANCELLED
```

## 🏛️ Architecture Details

### Domain Layer

The domain layer contains the core business logic:

- **Entities**: `Order`, `Customer`, `Product`, `OrderItem`
- **Value Objects**: `Money`, `Email`, `OrderStatus`
- **Domain Events**: `OrderCreatedEvent`, `OrderStatusChangedEvent`

### Application Layer

The application layer orchestrates business operations:

- **Use Cases**: `CreateOrderUseCase`, `UpdateOrderStatusUseCase`, etc.
- **Ports**: Interfaces defining contracts for external dependencies
- **Services**: Application services for complex business operations

### Infrastructure Layer

The infrastructure layer handles external concerns:

- **Repositories**: Database implementations of repository ports
- **Services**: External service implementations (notifications, events)
- **Mappers**: Convert between domain entities and ORM entities

### Presentation Layer

The presentation layer handles HTTP requests:

- **Controllers**: REST API endpoints
- **DTOs**: Data transfer objects for request/response validation
- **Swagger**: API documentation

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Test Structure

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows

## 🔧 SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Each class has a single reason to change
- Use cases handle specific business operations
- Repositories handle data persistence
- Controllers handle HTTP concerns

### Open/Closed Principle (OCP)
- Open for extension, closed for modification
- Use dependency injection for extensibility
- Implement interfaces for pluggable components

### Liskov Substitution Principle (LSP)
- All implementations can be substituted for their interfaces
- Repository adapters are interchangeable
- Service implementations are swappable

### Interface Segregation Principle (ISP)
- Clients depend only on interfaces they use
- Separate ports for different concerns
- Focused interfaces for specific operations

### Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- Use dependency injection
- Invert control through interfaces

## 🔄 RxJS Integration

### Reactive Programming Benefits

- **Asynchronous Operations**: Handle async operations elegantly
- **Event Handling**: Reactive event processing
- **Error Handling**: Centralized error management
- **Composition**: Combine multiple streams
- **Backpressure**: Handle high-load scenarios

### Usage Examples

```typescript
// Repository operations
findById(id: string): Observable<Order | null> {
  return from(this.repository.findOne({ where: { id } }));
}

// Use case orchestration
execute(request: CreateOrderRequest): Observable<CreateOrderResponse> {
  return this.validateCustomer(request.customerId).pipe(
    switchMap(customer => this.validateAndCreateOrderItems(request.items)),
    switchMap(orderItems => this.createOrder(request.customerId, orderItems)),
    switchMap(order => this.saveOrder(order))
  );
}
```

## 🚀 Best Practices

### Code Organization
- Follow hexagonal architecture principles
- Keep domain logic pure and testable
- Use dependency injection for loose coupling
- Implement proper error handling

### Performance
- Use database indexes for frequently queried fields
- Implement caching where appropriate
- Use pagination for large datasets
- Optimize database queries

### Security
- Validate all input data
- Use proper authentication and authorization
- Implement rate limiting
- Sanitize user inputs

### Monitoring
- Implement comprehensive logging
- Use structured logging with correlation IDs
- Monitor application metrics
- Set up health checks

## 📦 Project Structure

```
src/
├── domain/                 # Domain layer
│   ├── entities/          # Domain entities
│   ├── value-objects/     # Value objects
│   └── events/           # Domain events
├── application/           # Application layer
│   ├── use-cases/        # Business use cases
│   ├── ports/            # Interface definitions
│   └── services/         # Application services
├── infrastructure/        # Infrastructure layer
│   ├── database/         # Database entities and configuration
│   ├── repositories/     # Repository implementations
│   ├── services/         # External service implementations
│   ├── mappers/          # Entity mappers
│   └── event-handlers/   # Event handlers
└── presentation/         # Presentation layer
    ├── controllers/      # REST controllers
    ├── dto/             # Data transfer objects
    └── modules/         # NestJS modules
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- NestJS team for the excellent framework
- Domain-Driven Design community
- Clean Architecture principles by Robert C. Martin
- Hexagonal Architecture by Alistair Cockburn
