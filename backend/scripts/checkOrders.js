const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Order = require('../models/Order');

const checkOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user kk
    const user = await User.findOne({ username: 'kk' });

    if (!user) {
      console.log('❌ User kk not found');
      process.exit(1);
    }

    console.log(`👤 User: ${user.name} (${user.username})`);
    console.log(`   - Monthly Points: ${user.monthlyPoints || 0}`);
    console.log(`   - Generation 1 Points: ${user.generation1Points || 0}`);
    console.log(`   - Referred By: ${user.referredBy || 'N/A'}`);
    console.log('');

    // Find orders for kk
    const orders = await Order.find({ user: user._id });
    console.log(`📦 Orders for kk: ${orders.length}`);

    for (const order of orders) {
      console.log(`\n   Order #${order.orderNumber}:`);
      console.log(`   - Total Points: ${order.totalPoints || 0}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Created: ${order.createdAt}`);
    }

    // Check referredBy user
    if (user.referredBy) {
      const sponsor = await User.findById(user.referredBy);
      if (sponsor) {
        console.log(`\n\n👤 Sponsor: ${sponsor.name} (${sponsor.username})`);
        console.log(`   - Monthly Points: ${sponsor.monthlyPoints || 0}`);
        console.log(`   - Generation 1 Points: ${sponsor.generation1Points || 0}`);
        console.log(`   - Generation 2 Points: ${sponsor.generation2Points || 0}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkOrders();
