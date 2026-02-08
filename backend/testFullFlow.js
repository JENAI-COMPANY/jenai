const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const ProfitPeriod = require('./models/ProfitPeriod');

async function testFullFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات\n');

    // 1. البحث عن العميل والعضو المُحيل
    const customer = await User.findOne({ username: 'test3' });
    const referrer = await User.findById(customer.referredBy || customer.sponsorId);

    console.log('📋 المعلومات الأساسية:');
    console.log(`   - العميل: ${customer.name} (${customer.username})`);
    console.log(`   - الدور: ${customer.role}`);
    console.log(`   - العضو المُحيل: ${referrer.name} (${referrer.username})`);
    console.log(`   - ID العضو المُحيل: ${referrer._id}\n`);

    // 2. البحث عن طلبات الزبون
    const customerOrders = await Order.find({
      user: customer._id,
      isDelivered: true
    }).sort({ createdAt: -1 }).limit(3).populate('orderItems.product');

    console.log(`📦 طلبات العميل test3:`);
    console.log(`   - عدد الطلبات: ${customerOrders.length}\n`);

    for (const order of customerOrders) {
      console.log(`   الطلبية ${order.orderNumber}:`);
      console.log(`      - تاريخ الإنشاء: ${order.createdAt}`);
      console.log(`      - تاريخ التسليم: ${order.deliveredAt}`);
      console.log(`      - isDelivered: ${order.isDelivered}`);
      console.log(`      - referredBy: ${order.referredBy || 'غير محدد'}`);
      console.log(`      - عدد المنتجات: ${order.orderItems.length}`);

      // حساب فرق السعر لهذه الطلبية
      let orderPriceDiff = 0;
      for (const item of order.orderItems) {
        if (item.product) {
          const priceDiff = (item.product.customerPrice - item.product.subscriberPrice) * item.quantity;
          orderPriceDiff += priceDiff;
          console.log(`         - ${item.product.name}: (${item.product.customerPrice} - ${item.product.subscriberPrice}) × ${item.quantity} = ${priceDiff.toFixed(2)} شيكل`);
        }
      }
      console.log(`      - إجمالي فرق السعر: ${orderPriceDiff.toFixed(2)} شيكل\n`);
    }

    // 3. اختبار الاستعلام بنفس الطريقة التي يستخدمها profitPeriodController
    console.log('🔍 اختبار استعلام الطلبات (كما في profitPeriodController):\n');

    // التواريخ
    const startDate = '2026-02-01';
    const endDate = '2026-02-05';

    // بدون تعديل endDate (الطريقة القديمة)
    console.log('1️⃣ بدون تعديل endDate (منتصف الليل):');
    const oldQuery = await Order.find({
      referredBy: referrer._id,
      isDelivered: true,
      deliveredAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('user', 'role').populate('orderItems.product');
    console.log(`   - عدد الطلبات: ${oldQuery.length}`);
    console.log(`   - تاريخ البداية: ${new Date(startDate)}`);
    console.log(`   - تاريخ النهاية: ${new Date(endDate)}\n`);

    // مع تعديل endDate (الطريقة الجديدة)
    console.log('2️⃣ مع تعديل endDate (نهاية اليوم 23:59:59):');
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const newQuery = await Order.find({
      referredBy: referrer._id,
      isDelivered: true,
      deliveredAt: {
        $gte: new Date(startDate),
        $lte: endDateObj
      }
    }).populate('user', 'role').populate('orderItems.product');
    console.log(`   - عدد الطلبات: ${newQuery.length}`);
    console.log(`   - تاريخ البداية: ${new Date(startDate)}`);
    console.log(`   - تاريخ النهاية: ${endDateObj}\n`);

    // 4. حساب فرق السعر للطلبات المُستَرجَعة
    if (newQuery.length > 0) {
      console.log('💰 حساب فرق السعر للطلبات المُستَرجَعة:\n');
      let totalPriceDiff = 0;

      for (const order of newQuery) {
        console.log(`   الطلبية ${order.orderNumber}:`);
        console.log(`      - المستخدم: ${order.user?.name || 'غير محدد'}`);
        console.log(`      - دور المستخدم: ${order.user?.role || 'غير محدد'}`);

        if (order.user && order.user.role === 'customer') {
          let orderPriceDiff = 0;
          for (const item of order.orderItems) {
            if (item.product) {
              const priceDiff = (item.product.customerPrice - item.product.subscriberPrice) * item.quantity;
              orderPriceDiff += priceDiff;
              console.log(`         - ${item.product.name}: ${priceDiff.toFixed(2)} شيكل`);
            }
          }
          totalPriceDiff += orderPriceDiff;
          console.log(`      - فرق السعر للطلبية: ${orderPriceDiff.toFixed(2)} شيكل`);
        } else {
          console.log(`      ⚠️ هذه الطلبية ليست من زبون (role: ${order.user?.role})`);
        }
        console.log();
      }

      console.log(`✅ إجمالي فرق السعر لجميع الطلبات: ${totalPriceDiff.toFixed(2)} شيكل\n`);
    } else {
      console.log('⚠️ لم يتم إيجاد أي طلبات!\n');
    }

    // 5. التحقق من حالة العضو
    console.log('👤 حالة العضو المُحيل:');
    console.log(`   - النقاط الشهرية: ${referrer.monthlyPoints || 0}`);
    console.log(`   - الأرباح المتاحة: ${referrer.availableCommission || 0}`);
    console.log(`   - إجمالي الأرباح: ${referrer.totalCommission || 0}\n`);

    console.log('✅ انتهى الاختبار!');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

testFullFlow();
