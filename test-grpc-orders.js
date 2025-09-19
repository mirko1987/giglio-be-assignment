#!/usr/bin/env node

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto files
const PROTO_PATH_ORDER = path.join(__dirname, 'proto/order.proto');

// Load package definition
const orderPackageDefinition = protoLoader.loadSync(PROTO_PATH_ORDER, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load proto descriptor
const orderProto = grpc.loadPackageDefinition(orderPackageDefinition).order;

// Create client
const orderClient = new orderProto.OrderService('localhost:5001', grpc.credentials.createInsecure());

console.log('🧪 Testing gRPC Order API...\n');

// Using IDs from previous tests
const USER_ID = '441163ee-7389-41fb-ad47-8a6e684bb19c';  // gRPC Test User
const PRODUCT_ID = 'd2501b03-fd84-478f-adf9-00da959387bb'; // gRPC Test Product

// Test 1: Create Order
console.log('1. Testing Order Creation...');
orderClient.CreateOrder({
  user_id: USER_ID,
  items: [{
    product_id: PRODUCT_ID,
    quantity: 2,
    unit_price: 99.99,
    currency: 'USD'
  }]
}, (error, response) => {
  if (error) {
    console.error('❌ Order Creation Error:', error.message);
    console.error('Error details:', error);
  } else {
    console.log('✅ Order Created:', response);
    
    const orderId = response.order.id;
    
    // Test 2: Get Order
    console.log('\n2. Testing Get Order...');
    orderClient.GetOrder({
      id: orderId
    }, (error, response) => {
      if (error) {
        console.error('❌ Get Order Error:', error.message);
      } else {
        console.log('✅ Order Retrieved:', response);
      }
    });
    
    // Test 3: Update Order Status
    console.log('\n3. Testing Update Order Status...');
    orderClient.UpdateOrderStatus({
      id: orderId,
      status: 'CONFIRMED'
    }, (error, response) => {
      if (error) {
        console.error('❌ Update Order Status Error:', error.message);
      } else {
        console.log('✅ Order Status Updated:', response);
      }
    });
  }
});

// Test 4: List Orders
setTimeout(() => {
  console.log('\n4. Testing List Orders...');
  orderClient.ListOrders({
    page: 1,
    limit: 10
  }, (error, response) => {
    if (error) {
      console.error('❌ List Orders Error:', error.message);
    } else {
      console.log('✅ Orders Listed:', response);
      console.log('\n🎉 gRPC Order API Testing Complete!');
    }
    process.exit(0);
  });
}, 3000);

// Handle timeout
setTimeout(() => {
  console.log('\n⏰ Test timeout reached, exiting...');
  process.exit(0);
}, 10000);
