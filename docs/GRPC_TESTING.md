# gRPC Testing Guide

This document provides comprehensive instructions for testing the gRPC services in the NestJS Order System.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm run start:dev
```

The application will start both servers:
- **HTTP Server**: `http://localhost:3000`
- **gRPC Server**: `localhost:5000`

## 🛠️ Testing Tools

### Option 1: grpcurl (Recommended)
Install grpcurl for command-line testing:
```bash
# macOS
brew install grpcurl

# Linux
curl -sSL "https://github.com/fullstorydev/grpcurl/releases/download/v1.8.7/grpcurl_1.8.7_linux_x86_64.tar.gz" | tar -xz -C /usr/local/bin

# Windows
# Download from: https://github.com/fullstorydev/grpcurl/releases
```

### Option 2: BloomRPC (GUI)
Download BloomRPC: https://github.com/bloomrpc/bloomrpc

### Option 3: Postman (gRPC Support)
Use Postman's gRPC feature with the proto files.

## 📋 Service Testing

### User Service Tests

#### Create User
```bash
grpcurl -plaintext \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com"
  }' \
  localhost:5000 user.UserService/CreateUser
```

#### Get User
```bash
grpcurl -plaintext \
  -d '{"id": "user-uuid-here"}' \
  localhost:5000 user.UserService/GetUser
```

#### List Users
```bash
grpcurl -plaintext \
  -d '{"page": 1, "limit": 10}' \
  localhost:5000 user.UserService/ListUsers
```

#### Get User by Email
```bash
grpcurl -plaintext \
  -d '{"email": "john.doe@example.com"}' \
  localhost:5000 user.UserService/GetUserByEmail
```

#### Delete User
```bash
grpcurl -plaintext \
  -d '{"id": "user-uuid-here"}' \
  localhost:5000 user.UserService/DeleteUser
```

### Product Service Tests

#### Create Product
```bash
grpcurl -plaintext \
  -d '{
    "name": "MacBook Pro",
    "description": "Apple MacBook Pro 16-inch",
    "price": 2499.99,
    "currency": "USD",
    "sku": "MBP-16-2023",
    "stock": 10
  }' \
  localhost:5000 product.ProductService/CreateProduct
```

#### Get Product
```bash
grpcurl -plaintext \
  -d '{"id": "product-uuid-here"}' \
  localhost:5000 product.ProductService/GetProduct
```

#### List Products
```bash
grpcurl -plaintext \
  -d '{"page": 1, "limit": 10}' \
  localhost:5000 product.ProductService/ListProducts
```

#### Check Stock
```bash
grpcurl -plaintext \
  -d '{"id": "product-uuid-here", "quantity": 2}' \
  localhost:5000 product.ProductService/CheckStock
```

### Order Service Tests (Main Business Logic)

#### Create Order (Primary Business Operation)
```bash
grpcurl -plaintext \
  -d '{
    "user_id": "user-uuid-here",
    "items": [
      {
        "product_id": "product-uuid-here",
        "quantity": 2,
        "unit_price": 2499.99,
        "currency": "USD"
      }
    ]
  }' \
  localhost:5000 order.OrderService/CreateOrder
```

#### Get Order
```bash
grpcurl -plaintext \
  -d '{"id": "order-uuid-here"}' \
  localhost:5000 order.OrderService/GetOrder
```

#### List Orders
```bash
grpcurl -plaintext \
  -d '{"page": 1, "limit": 10}' \
  localhost:5000 order.OrderService/ListOrders
```

#### List Orders by User
```bash
grpcurl -plaintext \
  -d '{"user_id": "user-uuid-here", "page": 1, "limit": 10}' \
  localhost:5000 order.OrderService/GetOrdersByUser
```

#### Update Order Status
```bash
grpcurl -plaintext \
  -d '{"id": "order-uuid-here", "status": "PAID"}' \
  localhost:5000 order.OrderService/UpdateOrderStatus
```

#### Cancel Order
```bash
grpcurl -plaintext \
  -d '{"id": "order-uuid-here", "reason": "Customer request"}' \
  localhost:5000 order.OrderService/CancelOrder
```

## 🧪 Complete Testing Workflow

### 1. Create Test Data
```bash
# 1. Create a user
USER_RESPONSE=$(grpcurl -plaintext \
  -d '{"name": "Test User", "email": "test@example.com"}' \
  localhost:5000 user.UserService/CreateUser)

# Extract user ID from response
USER_ID="extracted-from-response"

# 2. Create a product
PRODUCT_RESPONSE=$(grpcurl -plaintext \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "price": 99.99,
    "currency": "USD",
    "sku": "TEST-001",
    "stock": 100
  }' \
  localhost:5000 product.ProductService/CreateProduct)

# Extract product ID from response
PRODUCT_ID="extracted-from-response"
```

### 2. Test Order Creation (Main Business Logic)
```bash
# 3. Create an order
ORDER_RESPONSE=$(grpcurl -plaintext \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"items\": [
      {
        \"product_id\": \"$PRODUCT_ID\",
        \"quantity\": 2,
        \"unit_price\": 99.99,
        \"currency\": \"USD\"
      }
    ]
  }" \
  localhost:5000 order.OrderService/CreateOrder)
```

### 3. Test Order Management
```bash
# 4. Update order status
grpcurl -plaintext \
  -d '{"id": "order-id", "status": "PAID"}' \
  localhost:5000 order.OrderService/UpdateOrderStatus

# 5. List user orders
grpcurl -plaintext \
  -d '{"user_id": "user-id"}' \
  localhost:5000 order.OrderService/GetOrdersByUser
```

## 🔧 Proto File Locations

The proto files are located in the `proto/` directory:
- `proto/user.proto` - User service definitions
- `proto/product.proto` - Product service definitions  
- `proto/order.proto` - Order service definitions

## 📊 Expected Responses

### Successful User Creation
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "created_at": "2023-12-01T10:00:00.000Z"
  }
}
```

### Successful Order Creation
```json
{
  "order": {
    "id": "order-uuid",
    "user_id": "user-uuid",
    "user_name": "John Doe",
    "user_email": "john.doe@example.com",
    "items": [
      {
        "product_id": "product-uuid",
        "product_name": "MacBook Pro",
        "quantity": 2,
        "unit_price": 2499.99,
        "subtotal": 4999.98,
        "currency": "USD"
      }
    ],
    "status": "PENDING",
    "total_amount": 4999.98,
    "currency": "USD",
    "created_at": "2023-12-01T10:00:00.000Z",
    "updated_at": "2023-12-01T10:00:00.000Z"
  }
}
```

## ⚠️ Error Handling

The gRPC services return appropriate error codes:

- `INVALID_ARGUMENT` (3) - Invalid request data
- `NOT_FOUND` (5) - Resource not found
- `ALREADY_EXISTS` (6) - Resource already exists
- `INTERNAL` (13) - Internal server error

### Example Error Response
```bash
# Invalid email format
grpcurl -plaintext \
  -d '{"name": "Test", "email": "invalid-email"}' \
  localhost:5000 user.UserService/CreateUser

# Returns:
# ERROR: Code: InvalidArgument, Message: Email format is invalid
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the application is running: `npm run start:dev`
   - Check that port 5000 is not in use

2. **Proto File Errors**
   - Verify proto files are in the `proto/` directory
   - Check proto syntax is valid

3. **Service Not Found**
   - Ensure the service is properly registered in the gRPC module
   - Check the service name matches the proto definition

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run start:dev
```

## 📝 Notes

- All gRPC services implement full CRUD operations as required
- The `CreateOrder` method includes comprehensive business logic validation
- Error handling follows gRPC best practices with appropriate status codes
- All services use the existing domain logic and repository patterns
- The application runs as a hybrid HTTP/gRPC server for maximum flexibility
