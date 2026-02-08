const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// دالة توزيع العمولات (نسخة من orderController.js)
const distributeCommissions = async (buyer, productPoints) => {
  try {
    // النسب الثابتة لعمولة الأجيال (للجميع)
    const GENERATION_RATES = [0.11, 0.08, 0.06, 0.03, 0.02]; // 11%, 8%, 6%, 3%, 2%

    // نسب عمولة القيادة حسب الرتبة
    const LEADERSHIP_RATES = {
      'agent': [],
      'bronze': [0.05], // جيل 1 فقط
      'gold': [0.05, 0.04], // جيل 1+2
      'silver': [0.05, 0.04, 0.03], // جيل 1+2+3
      'ruby': [0.05, 0.04, 0.03, 0.02], // جيل 1+2+3+4
      'diamond': [0.05, 0.04, 0.03, 0.02, 0.01], // الخمسة
      'double_diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
      'regional_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01],
      'global_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01]
    };

    // معامل التحويل من نقاط إلى شيكل
    const POINTS_TO_CURRENCY = 0.55;

    // ══════════════════════════════════════
    // 1. الربح الشخصي للمشتري (20%)
    // ══════════════════════════════════════
    const personalPoints = productPoints * 0.20;
    const personalProfit = personalPoints * POINTS_TO_CURRENCY;

    buyer.points = (buyer.points || 0) + productPoints;
    buyer.monthlyPoints = (buyer.monthlyPoints || 0) + productPoints;
    buyer.totalCommission = Math.floor((buyer.totalCommission || 0) + personalProfit);
    buyer.availableCommission = Math.floor((buyer.availableCommission || 0) + personalProfit);
    await buyer.save();

    console.log(`💰 ${buyer.name} (المشتري) - نقاط: ${productPoints}, ربح شخصي: ${personalProfit} شيكل`);

    // ══════════════════════════════════════
    // 2. توزيع على الأجيال الخمسة
    // ══════════════════════════════════════
    let currentMemberId = buyer.referredBy;
    let generationLevel = 0;

    while (currentMemberId && generationLevel < 5) {
      const currentMember = await User.findById(currentMemberId);

      if (!currentMember || currentMember.role !== 'member') break;

      // عمولة الأجيال (ثابتة)
      const genRate = GENERATION_RATES[generationLevel];
      const genPoints = productPoints * genRate;

      // عمولة القيادة (حسب الرتبة)
      const leadershipRates = LEADERSHIP_RATES[currentMember.memberRank] || [];
      const leadershipRate = leadershipRates[generationLevel] || 0;
      const leadershipPoints = productPoints * leadershipRate;

      // إجمالي النقاط والربح
      const totalPoints = genPoints + leadershipPoints;
      const profit = totalPoints * POINTS_TO_CURRENCY;

      // تحديث العضو
      const genFieldName = `generation${generationLevel + 1}Points`;
      currentMember[genFieldName] = (currentMember[genFieldName] || 0) + genPoints;

      if (leadershipPoints > 0) {
        currentMember.leadershipPoints = (currentMember.leadershipPoints || 0) + leadershipPoints;
      }

      currentMember.totalCommission = Math.floor((currentMember.totalCommission || 0) + profit);
      currentMember.availableCommission = Math.floor((currentMember.availableCommission || 0) + profit);

      await currentMember.save();

      console.log(`💰 ${currentMember.name} (جيل ${generationLevel + 1}) - نقاط أجيال: ${genPoints.toFixed(2)}, نقاط قيادة: ${leadershipPoints.toFixed(2)}, ربح: ${profit} شيكل`);

      // الانتقال للجيل التالي
      currentMemberId = currentMember.referredBy;
      generationLevel++;
    }
  } catch (error) {
    console.error('❌ خطأ في توزيع العمولات:', error);
  }
};

async function testCustomerOrderPoints() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ متصل بقاعدة البيانات');

    // 1. البحث عن العميل test3
    const customer = await User.findOne({ username: 'test3' });
    if (!customer) {
      console.log('❌ العميل test3 غير موجود');
      process.exit(1);
    }
    console.log(`\n📋 العميل: ${customer.name} (${customer.username})`);
    console.log(`   - الدور: ${customer.role}`);
    console.log(`   - المُحيل (sponsorId): ${customer.sponsorId}`);
    console.log(`   - المُحيل (referredBy): ${customer.referredBy}`);

    // 2. البحث عن العضو المُحيل
    const referrerId = customer.sponsorId || customer.referredBy;
    if (!referrerId) {
      console.log('❌ العميل ليس لديه مُحيل');
      process.exit(1);
    }

    const referrer = await User.findById(referrerId);
    if (!referrer) {
      console.log('❌ العضو المُحيل غير موجود');
      process.exit(1);
    }
    console.log(`\n👤 العضو المُحيل: ${referrer.name} (${referrer.username})`);
    console.log(`   - الدور: ${referrer.role}`);
    console.log(`   - النقاط التراكمية الحالية: ${referrer.points || 0}`);
    console.log(`   - النقاط الشهرية الحالية: ${referrer.monthlyPoints || 0}`);
    console.log(`   - generation1Points: ${referrer.generation1Points || 0}`);
    console.log(`   - الأرباح المتاحة: ${referrer.availableCommission || 0}`);

    // 3. البحث عن المنتج "تجربة"
    const product = await Product.findOne({ name: 'تجربة' });
    if (!product) {
      console.log('❌ المنتج "تجربة" غير موجود');
      process.exit(1);
    }
    console.log(`\n🛍️ المنتج: ${product.name}`);
    console.log(`   - سعر الزبون: ${product.customerPrice}`);
    console.log(`   - سعر العضو: ${product.subscriberPrice}`);
    console.log(`   - فرق السعر: ${product.customerPrice - product.subscriberPrice}`);
    console.log(`   - النقاط: ${product.points}`);

    // 4. محاكاة إنشاء طلبية
    console.log('\n🔨 إنشاء طلبية تجريبية...');

    const orderItems = [{
      product: product._id,
      name: product.name,
      quantity: 1,
      price: product.customerPrice,
      image: product.images && product.images.length > 0 ? product.images[0] : ''
    }];

    const totalAmount = product.customerPrice;

    const order = await Order.create({
      user: customer._id,
      orderItems: orderItems,
      shippingAddress: {
        fullName: customer.name,
        phone: customer.phone || '0599999999',
        city: 'جنين',
        street: 'شارع تجريبي',
        address: 'عنوان تجريبي',
        country: 'فلسطين'
      },
      contactPhone: customer.phone || '0599999999',
      paymentMethod: 'cash_on_delivery',
      totalAmount: totalAmount,
      orderStatus: 'delivered',
      isPaid: true,
      paidAt: new Date(),
      deliveredAt: new Date()
    });

    console.log(`✅ تم إنشاء الطلبية: ${order.orderNumber}`);

    // 5. حساب فرق السعر والنقاط (نفس المنطق من orderController.js)
    let totalPriceDifference = 0;
    let totalPoints = 0;

    for (const item of orderItems) {
      if (item.product) {
        const prod = await Product.findById(item.product);
        if (prod) {
          // حساب فرق السعر
          if (prod.customerPrice && prod.subscriberPrice) {
            const priceDiff = prod.customerPrice - prod.subscriberPrice;
            totalPriceDifference += priceDiff * item.quantity;
          }

          // حساب النقاط
          if (prod.points) {
            totalPoints += prod.points * item.quantity;
          }
        }
      }
    }

    console.log(`\n💰 الحسابات:`);
    console.log(`   - فرق السعر الكلي: ${totalPriceDifference} شيكل`);
    console.log(`   - النقاط الكلية: ${totalPoints} نقطة`);

    // 6. إضافة فرق السعر للعضو المُحيل
    if (totalPriceDifference > 0) {
      referrer.totalCommission = Math.floor((referrer.totalCommission || 0) + totalPriceDifference);
      referrer.availableCommission = Math.floor((referrer.availableCommission || 0) + totalPriceDifference);
      console.log(`\n✅ تم إضافة ${totalPriceDifference} شيكل لأرباح ${referrer.name}`);
    }

    // 7. توزيع النقاط
    if (totalPoints > 0) {
      await Order.findByIdAndUpdate(order._id, {
        totalPoints: totalPoints,
        referredMember: referrer._id
      });

      console.log(`\n📊 توزيع ${totalPoints} نقطة على شجرة ${referrer.name}...`);
      await distributeCommissions(referrer, totalPoints);
    }

    await referrer.save();

    // 8. التحقق من النتائج
    console.log('\n🔍 التحقق من النتائج...');
    const updatedReferrer = await User.findById(referrer._id);

    console.log(`\n📊 حالة العضو المُحيل بعد التوزيع:`);
    console.log(`   - النقاط التراكمية: ${updatedReferrer.points || 0}`);
    console.log(`   - النقاط الشهرية: ${updatedReferrer.monthlyPoints || 0}`);
    console.log(`   - generation1Points: ${updatedReferrer.generation1Points || 0}`);
    console.log(`   - الأرباح المتاحة: ${updatedReferrer.availableCommission || 0}`);

    const updatedOrder = await Order.findById(order._id);
    console.log(`\n📦 معلومات الطلبية:`);
    console.log(`   - رقم الطلبية: ${updatedOrder.orderNumber}`);
    console.log(`   - النقاط: ${updatedOrder.totalPoints || 0}`);
    console.log(`   - العضو المُحيل: ${updatedOrder.referredMember || 'غير محدد'}`);

    console.log('\n✅ انتهى الاختبار بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 تم إغلاق الاتصال بقاعدة البيانات');
  }
}

testCustomerOrderPoints();
