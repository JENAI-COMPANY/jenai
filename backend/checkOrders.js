const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const User = require('./models/User');

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات\n');

    // Find customer test3
    const customer = await User.findOne({ username: 'test3' });
    if (!customer) {
      console.log('❌ العميل test3 غير موجود');
      process.exit(1);
    }

    console.log(`📋 العميل: ${customer.name} (ID: ${customer._id})`);
    console.log(`   - المُحيل (sponsorId): ${customer.sponsorId}`);
    console.log(`   - المُحيل (referredBy): ${customer.referredBy}\n`);

    // Find all orders for test3
    const orders = await Order.find({ user: customer._id })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`📦 عدد الطلبيات للعميل test3: ${orders.length}\n`);

    for (const order of orders) {
      console.log(`الطلبية: ${order.orderNumber}`);
      console.log(`   - تاريخ الإنشاء: ${order.createdAt}`);
      console.log(`   - الحالة: ${order.status}`);
      console.log(`   - تم التسليم: ${order.isDelivered}`);
      console.log(`   - تاريخ التسليم: ${order.deliveredAt}`);
      console.log(`   - النقاط: ${order.totalPoints || 0}`);
      console.log(`   - referredBy: ${order.referredBy || 'غير محدد'}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkOrders();
