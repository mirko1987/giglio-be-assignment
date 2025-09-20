# gRPC Manual Testing Tools

This folder contains standalone Node.js scripts for manual gRPC API testing.

## 📋 Available Tools

### `test-grpc-client.js`
- **Purpose**: Tests User and Product gRPC services
- **Features**: Create/Get users, Create/Get products, Check stock, List operations
- **Usage**: `node tools/grpc-testing/test-grpc-client.js`

### `test-grpc-orders.js`  
- **Purpose**: Tests Order gRPC service
- **Features**: Create orders, Get orders, Update status, List orders
- **Usage**: `node tools/grpc-testing/test-grpc-orders.js`

## 🚀 Prerequisites

1. **Start the application**:
   ```bash
   npm run start:dev
   ```

2. **Ensure gRPC server is running** on `localhost:5001`

3. **Run the scripts**:
   ```bash
   # Test User & Product services
   node tools/grpc-testing/test-grpc-client.js
   
   # Test Order service  
   node tools/grpc-testing/test-grpc-orders.js
   ```

## 📝 Notes

- These are **manual testing tools**, not part of the automated test suite
- Use these for **interactive gRPC API exploration** and debugging
- For **automated gRPC testing**, see `test/e2e/grpc-api.e2e-spec.ts`
- Scripts use hardcoded IDs - modify as needed for your testing

## 🔧 Dependencies

- `@grpc/grpc-js` - gRPC client library
- `@grpc/proto-loader` - Proto file loader
- Proto files from `proto/` directory
