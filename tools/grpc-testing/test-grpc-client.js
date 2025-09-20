#!/usr/bin/env node

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto files
const PROTO_PATH_USER = path.join(__dirname, 'proto/user.proto');
const PROTO_PATH_PRODUCT = path.join(__dirname, 'proto/product.proto');
const PROTO_PATH_ORDER = path.join(__dirname, 'proto/order.proto');

// Load package definitions
const userPackageDefinition = protoLoader.loadSync(PROTO_PATH_USER, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const productPackageDefinition = protoLoader.loadSync(PROTO_PATH_PRODUCT, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load proto descriptors
const userProto = grpc.loadPackageDefinition(userPackageDefinition).user;
const productProto = grpc.loadPackageDefinition(productPackageDefinition).product;

// Create clients
const userClient = new userProto.UserService('localhost:5001', grpc.credentials.createInsecure());
const productClient = new productProto.ProductService('localhost:5001', grpc.credentials.createInsecure());

console.log('🧪 Testing gRPC API...\n');

// Test 1: Create User
console.log('1. Testing User Creation...');
userClient.CreateUser({
  name: 'gRPC Test User',
  email: 'grpc.test@example.com'
}, (error, response) => {
  if (error) {
    console.error('❌ User Creation Error:', error.message);
  } else {
    console.log('✅ User Created:', response);
    
    // Test 2: Get User
    console.log('\n2. Testing Get User...');
    userClient.GetUser({
      id: response.user.id
    }, (error, response) => {
      if (error) {
        console.error('❌ Get User Error:', error.message);
      } else {
        console.log('✅ User Retrieved:', response);
      }
    });
  }
});

// Test 3: Create Product
console.log('\n3. Testing Product Creation...');
productClient.CreateProduct({
  name: 'gRPC Test Product',
  description: 'A product created via gRPC',
  price: 99.99,
  currency: 'USD',
  sku: 'GRPC-TEST-001',
  stock: 100
}, (error, response) => {
  if (error) {
    console.error('❌ Product Creation Error:', error.message);
  } else {
    console.log('✅ Product Created:', response);
    
    // Test 4: Get Product
    console.log('\n4. Testing Get Product...');
    productClient.GetProduct({
      id: response.product.id
    }, (error, response) => {
      if (error) {
        console.error('❌ Get Product Error:', error.message);
      } else {
        console.log('✅ Product Retrieved:', response);
      }
    });
    
    // Test 5: Check Stock
    console.log('\n5. Testing Check Stock...');
    productClient.CheckStock({
      id: response.product.id,
      quantity: 5
    }, (error, response) => {
      if (error) {
        console.error('❌ Check Stock Error:', error.message);
      } else {
        console.log('✅ Stock Check:', response);
      }
    });
  }
});

// Test 6: List Users
setTimeout(() => {
  console.log('\n6. Testing List Users...');
  userClient.ListUsers({
    page: 1,
    limit: 10
  }, (error, response) => {
    if (error) {
      console.error('❌ List Users Error:', error.message);
    } else {
      console.log('✅ Users Listed:', response);
    }
  });
}, 2000);

// Test 7: List Products
setTimeout(() => {
  console.log('\n7. Testing List Products...');
  productClient.ListProducts({
    page: 1,
    limit: 10,
    search: ''
  }, (error, response) => {
    if (error) {
      console.error('❌ List Products Error:', error.message);
    } else {
      console.log('✅ Products Listed:', response);
      console.log('\n🎉 gRPC API Testing Complete!');
      process.exit(0);
    }
  });
}, 3000);

// Handle timeout
setTimeout(() => {
  console.log('\n⏰ Test timeout reached, exiting...');
  process.exit(0);
}, 10000);
