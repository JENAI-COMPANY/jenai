// Script to update soldCount based on received orders
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');

async function updateSoldCounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all received orders
    const receivedOrders = await Order.find({ status: 'received' });
    console.log(`Found ${receivedOrders.length} received orders`);

    // Calculate sold count for each product
    const soldCounts = {};

    for (const order of receivedOrders) {
      for (const item of order.orderItems) {
        if (item.product) {
          const productId = item.product.toString();
          if (!soldCounts[productId]) {
            soldCounts[productId] = 0;
          }
          soldCounts[productId] += item.quantity;
        }
      }
    }

    console.log('Sold counts:', soldCounts);

    // Update each product
    for (const [productId, count] of Object.entries(soldCounts)) {
      const product = await Product.findById(productId);
      if (product) {
        product.soldCount = count;
        await product.save();
        console.log(`Updated ${product.name}: soldCount = ${count}`);
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateSoldCounts();
