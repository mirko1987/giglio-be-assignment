# 🚀 Quick Start Guide

## **30-Second Setup**

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp env.example .env

# 3. Start database
docker-compose up -d

# 4. Start application
npm run start:dev
```

## **Verify Installation**

```bash
# Health check
curl http://localhost:3000/health

# API documentation
open http://localhost:3000/api/docs

# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Create a product
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop", "description": "Gaming laptop", "price": 999.99, "stock": 10}'
```

## **Available Services**

- **HTTP API**: http://localhost:3000
- **gRPC API**: localhost:5001
- **Health Checks**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api/docs
- **Database**: MySQL on localhost:3306

## **Test Everything**

```bash
npm run test:all
```

That's it! 🎉 Your enterprise-grade NestJS application is running.

For detailed documentation, see [README.md](./README.md).
