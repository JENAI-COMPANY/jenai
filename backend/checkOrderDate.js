const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./models/Order');
const User = require('./models/User');

async function checkOrderDate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات\n');

    // البحث عن آخر طلب للزبون test3
    const customer = await User.findOne({ username: 'test3' });
    if (!customer) {
      console.log('❌ العميل test3 غير موجود');
      process.exit(1);
    }

    const latestOrder = await Order.findOne({ user: customer._id })
      .sort({ createdAt: -1 })
      .populate('user', 'username name role')
      .populate('referredBy', 'username name');

    if (!latestOrder) {
      console.log('❌ لا توجد طلبات للعميل test3');
      process.exit(1);
    }

    console.log('📦 آخر طلب للعميل test3:');
    console.log(`   - رقم الطلب: ${latestOrder.orderNumber}`);
    console.log(`   - الحالة: ${latestOrder.orderStatus}`);
    console.log(`   - isDelivered: ${latestOrder.isDelivered}`);
    console.log(`   - تاريخ الإنشاء (createdAt): ${latestOrder.createdAt}`);
    console.log(`   - تاريخ التسليم (deliveredAt): ${latestOrder.deliveredAt}`);
    console.log(`   - العضو المُحيل (referredBy): ${latestOrder.referredBy ? latestOrder.referredBy.name : 'غير محدد'}`);
    console.log(`   - ID العضو المُحيل: ${latestOrder.referredBy ? latestOrder.referredBy._id : 'غير محدد'}`);

    // اختبار الاستعلامات بتواريخ مختلفة
    const memberId = latestOrder.referredBy?._id;
    if (!memberId) {
      console.log('\n❌ لا يوجد عضو مُحيل');
      process.exit(1);
    }

    console.log('\n🔍 اختبار الاستعلامات بتواريخ مختلفة:\n');

    // اليوم (بداية ونهاية اليوم)
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    console.log('1️⃣ اليوم (من بداية اليوم إلى نهايته):');
    console.log(`   من: ${startOfToday}`);
    console.log(`   إلى: ${endOfToday}`);

    const todayOrders = await Order.find({
      referredBy: memberId,
      isDelivered: true,
      deliveredAt: {
        $gte: startOfToday,
        $lte: endOfToday
      }
    });
    console.log(`   ✅ عدد الطلبات: ${todayOrders.length}\n`);

    // آخر 30 يوم
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log('2️⃣ آخر 30 يوم:');
    console.log(`   من: ${thirtyDaysAgo}`);
    console.log(`   إلى: ${new Date()}`);

    const last30DaysOrders = await Order.find({
      referredBy: memberId,
      isDelivered: true,
      deliveredAt: {
        $gte: thirtyDaysAgo,
        $lte: new Date()
      }
    });
    console.log(`   ✅ عدد الطلبات: ${last30DaysOrders.length}\n`);

    // بدون تصفية بالتاريخ
    console.log('3️⃣ بدون تصفية بالتاريخ:');
    const allOrders = await Order.find({
      referredBy: memberId,
      isDelivered: true
    });
    console.log(`   ✅ عدد الطلبات: ${allOrders.length}\n`);

    // طباعة تفاصيل كل طلب
    if (allOrders.length > 0) {
      console.log('📋 تفاصيل جميع الطلبات المُستَرجَعة:');
      for (const order of allOrders) {
        console.log(`   - ${order.orderNumber}: deliveredAt = ${order.deliveredAt}`);
      }
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

checkOrderDate();
