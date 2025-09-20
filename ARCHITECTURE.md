# 🏗️ Architecture Documentation

## **System Overview**

This application implements **Hexagonal Architecture** (Ports and Adapters pattern) with **Domain-Driven Design** principles, providing a clean, maintainable, and testable codebase.

## **Architecture Layers**

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                   │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │  REST Controllers│  │    gRPC Controllers           ││
│  │  - HTTP/JSON     │  │    - Protocol Buffers         ││
│  │  - Swagger Docs  │  │    - High Performance          ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                     │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │   Use Cases     │  │        Services                 ││
│  │  - CreateOrder  │  │  - OrderProcessingService       ││
│  │  - CreateUser   │  │  - Business Logic               ││
│  │  - CreateProduct│  │  - Orchestration                ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                        │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │    Entities     │  │      Value Objects              ││
│  │  - Order        │  │  - Money                        ││
│  │  - User         │  │  - Email                        ││
│  │  - Product      │  │  - OrderStatus                  ││
│  │  - OrderItem    │  │                                 ││
│  └─────────────────┘  └─────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐ │
│  │                Domain Events                        │ │
│  │  - OrderCreated                                     │ │
│  │  - OrderStatusChanged                               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                    │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │   Repositories  │  │        External Services        ││
│  │  - OrderRepo    │  │  - EventPublisher               ││
│  │  - UserRepo     │  │  - NotificationService          ││
│  │  - ProductRepo  │  │  - Health Monitoring            ││
│  └─────────────────┘  └─────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐ │
│  │                   Database                          │ │
│  │  - MySQL (Production)                               │ │
│  │  - SQLite (Testing)                                 │ │
│  │  - TypeORM Entities                                 │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## **Design Patterns**

### **1. Hexagonal Architecture (Ports & Adapters)**
- **Ports**: Interfaces defining what the application can do
- **Adapters**: Implementations of ports for specific technologies
- **Benefits**: Technology-agnostic core, easy testing, loose coupling

### **2. Domain-Driven Design (DDD)**
- **Entities**: Objects with identity (Order, User, Product)
- **Value Objects**: Immutable objects (Money, Email, OrderStatus)
- **Aggregates**: Consistency boundaries (Order + OrderItems)
- **Domain Events**: Business events (OrderCreated, StatusChanged)

### **3. SOLID Principles**
- **S**: Single Responsibility - Each class has one job
- **O**: Open/Closed - Extensible without modification
- **L**: Liskov Substitution - Proper inheritance
- **I**: Interface Segregation - Focused interfaces
- **D**: Dependency Inversion - Depend on abstractions

### **4. Event-Driven Architecture**
- **Domain Events**: Business events published by aggregates
- **Event Handlers**: React to domain events
- **Decoupling**: Loose coupling between bounded contexts

## **Folder Structure**

```
src/
├── main.ts                     # Application bootstrap
├── app.module.ts              # Root module
├── common/                    # Shared utilities
│   ├── filters/              # Global exception filters
│   └── interceptors/         # Request/response interceptors
├── presentation/             # Presentation Layer
│   ├── controllers/         # REST controllers
│   ├── dto/                # Data transfer objects
│   ├── grpc/               # gRPC controllers & config
│   └── modules/            # Feature modules
├── application/             # Application Layer
│   ├── ports/              # Interface definitions
│   ├── services/           # Application services
│   └── use-cases/         # Business use cases
├── domain/                 # Domain Layer
│   ├── entities/          # Domain entities
│   ├── events/            # Domain events
│   └── value-objects/     # Value objects
└── infrastructure/        # Infrastructure Layer
    ├── database/         # Database configuration & entities
    ├── repositories/     # Repository implementations
    ├── services/        # External service adapters
    ├── mappers/         # Entity-ORM mappers
    ├── event-handlers/  # Domain event handlers
    └── health/          # Health monitoring
```

## **Data Flow**

### **Inbound Request Flow**
```
1. HTTP Request → Controller
2. Controller → Use Case
3. Use Case → Domain Service
4. Domain Service → Repository Port
5. Repository Adapter → Database
6. Response flows back through layers
```

### **Event Flow**
```
1. Domain Entity → Publishes Event
2. Event Publisher → Distributes Event
3. Event Handlers → Process Event
4. Side Effects → External Services
```

## **Key Components**

### **Domain Entities**

#### **Order Aggregate**
```typescript
class Order {
  // Business rules and invariants
  // Status transitions
  // Order validation
  // Domain events
}
```

#### **Value Objects**
```typescript
class Money {
  // Immutable monetary values
  // Currency handling
  // Arithmetic operations
}
```

### **Use Cases**
```typescript
class CreateOrderUseCase {
  // Orchestrates order creation
  // Validates business rules
  // Publishes domain events
}
```

### **Repository Pattern**
```typescript
interface OrderRepositoryPort {
  // Abstract repository interface
}

class OrderRepositoryAdapter implements OrderRepositoryPort {
  // Concrete database implementation
}
```

## **Testing Strategy**

### **Test Pyramid**
```
        ┌─────────────┐
        │   E2E Tests │  ← Full system testing
        └─────────────┘
      ┌─────────────────┐
      │Integration Tests│  ← Component interaction
      └─────────────────┘
  ┌───────────────────────┐
  │     Unit Tests        │  ← Business logic
  └───────────────────────┘
```

### **Test Types**
- **Unit Tests**: Domain entities, use cases, value objects
- **Integration Tests**: Repository adapters, database interactions
- **E2E Tests**: Full API testing (REST + gRPC)

### **Test Isolation**
- **Unit**: No external dependencies
- **Integration**: In-memory SQLite database
- **E2E**: Full application with test database

## **Production Features**

### **Observability**
- **Health Checks**: Database, memory, disk, custom indicators
- **Structured Logging**: JSON logs with correlation IDs
- **Request Tracking**: Performance monitoring
- **Error Handling**: Global exception filters

### **Scalability**
- **Stateless Design**: No session state
- **Database Optimization**: Connection pooling
- **Caching Strategy**: Ready for Redis integration
- **Load Balancing**: Horizontal scaling support

### **Security**
- **Input Validation**: Class-validator integration
- **CORS Configuration**: Configurable origins
- **Error Sanitization**: Production-safe error responses
- **Environment Configuration**: Secure defaults

## **Technology Decisions**

### **Framework Choice: NestJS**
- **Enterprise-ready**: Production-grade features
- **TypeScript-first**: Type safety and developer experience
- **Modular**: Clean separation of concerns
- **Ecosystem**: Rich ecosystem of modules

### **Database: MySQL**
- **ACID Compliance**: Strong consistency guarantees
- **Performance**: Proven at scale
- **Tooling**: Rich ecosystem and monitoring

### **ORM: TypeORM**
- **TypeScript Integration**: Type-safe database operations
- **Migration Support**: Database versioning
- **Active Record/Data Mapper**: Flexible patterns

### **Testing: Jest**
- **TypeScript Support**: Native TypeScript support
- **Mocking**: Powerful mocking capabilities
- **Coverage**: Built-in coverage reporting

## **Future Enhancements**

### **Phase 1: Security & Performance**
- Authentication & Authorization (JWT)
- Rate limiting (ThrottlerModule)
- Response compression
- Security headers (Helmet)

### **Phase 2: Advanced Features**
- Caching (Redis)
- Message Queues (Bull/Redis)
- API Versioning
- Metrics (Prometheus)

### **Phase 3: Microservices**
- Service decomposition
- Event sourcing
- CQRS pattern
- Distributed tracing

---

This architecture provides a solid foundation for enterprise applications with clean separation of concerns, testability, and maintainability.
