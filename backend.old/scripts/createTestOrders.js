const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/network-marketing');

const Order = mongoose.model('Order');
const User = mongoose.model('User');
const Product = mongoose.model('Product');

async function createTestOrders() {
  try {
    console.log('Creating test orders...\n');
    
    const users = await User.find().limit(3);
    const products = await Product.find().limit(5);
    
    if (users.length === 0 || products.length === 0) {
      console.log('Need users and products first');
      process.exit(1);
    }

    await Order.deleteMany({});
    
    const testOrders = [
      {
        user: users[0]._id,
        items: [{
          product: products[0]._id,
          productName: products[0].name,
          quantity: 2,
          price: products[0].customerPrice || 50
        }],
        totalAmount: (products[0].customerPrice || 50) * 2,
        status: 'pending',
        shippingAddress: {
          fullName: 'Test User 1',
          phone: '+966501234567',
          address: 'Test Address 1',
          city: 'Riyadh'
        },
        paymentMethod: 'cash'
      },
      {
        user: users[0]._id,
        items: [{
          product: products[1]._id,
          productName: products[1].name,
          quantity: 1,
          price: products[1].customerPrice || 100
        }],
        totalAmount: products[1].customerPrice || 100,
        status: 'processing',
        shippingAddress: {
          fullName: 'Test User 2',
          phone: '+966502345678',
          address: 'Test Address 2',
          city: 'Jeddah'
        },
        paymentMethod: 'credit_card'
      },
      {
        user: users[0]._id,
        items: [{
          product: products[2]._id,
          productName: products[2].name,
          quantity: 3,
          price: products[2].customerPrice || 75
        }],
        totalAmount: (products[2].customerPrice || 75) * 3,
        status: 'shipped',
        shippingAddress: {
          fullName: 'Test User 3',
          phone: '+966503456789',
          address: 'Test Address 3',
          city: 'Dammam'
        },
        paymentMethod: 'cash'
      }
    ];

    for (const orderData of testOrders) {
      await Order.create(orderData);
    }

    console.log('Created 3 test orders successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestOrders();
