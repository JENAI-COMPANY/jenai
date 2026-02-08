const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');

async function checkKKOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات\n');

    const kk = await User.findOne({ username: 'kk' });
    console.log(`العضو kk ID: ${kk._id}\n`);

    // جلب جميع الطلبيات المحالة من kk والمسلمة
    const orders = await Order.find({
      referredBy: kk._id,
      isDelivered: true
    }).populate('user', 'username name').populate('orderItems.product', 'name customerPrice subscriberPrice');

    console.log(`📦 جميع الطلبيات المحالة من kk: ${orders.length}\n`);

    let totalPriceDiff = 0;
    for (const order of orders) {
      console.log(`الطلبية: ${order.orderNumber}`);
      console.log(`   - العميل: ${order.user?.username || 'غير محدد'} (${order.user?.name || 'غير محدد'})`);
      console.log(`   - deliveredAt: ${order.deliveredAt}`);

      let orderPriceDiff = 0;
      if (order.orderItems.length > 0 && order.orderItems[0].product) {
        const product = order.orderItems[0].product;
        console.log(`   - المنتج: ${product.name}`);

        const priceDiff = (product.customerPrice - product.subscriberPrice) * order.orderItems[0].quantity;
        orderPriceDiff = priceDiff;
        totalPriceDiff += priceDiff;

        console.log(`   - فرق السعر: (${product.customerPrice} - ${product.subscriberPrice}) × ${order.orderItems[0].quantity} = ${priceDiff.toFixed(2)} شيكل`);
      }
      console.log('');
    }

    console.log(`\n✅ إجمالي فرق السعر لجميع الطلبيات: ${totalPriceDiff.toFixed(2)} شيكل`);

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkKKOrders();
