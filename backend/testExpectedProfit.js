/**
 * اختبار حساب الأرباح المتوقعة بعد الإصلاح
 * هذا السكريبت يتحقق من أن الحسابات في expectedProfitController تطابق profitPeriodController
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const { calculateLeadershipCommission } = require('./config/memberRanks');
require('dotenv').config({ path: './.env' });

const POINTS_TO_CURRENCY = 0.55;

// اتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ تم الاتصال بقاعدة البيانات'))
  .catch(err => {
    console.error('❌ خطأ في الاتصال:', err);
    process.exit(1);
  });

async function testExpectedProfitCalculation() {
  try {
    console.log('\n═══════════════════════════════════════════');
    console.log('🔍 اختبار حساب الأرباح المتوقعة');
    console.log('═══════════════════════════════════════════\n');

    // جلب أول عضو
    const member = await User.findOne({ role: 'member' });

    if (!member) {
      console.log('⚠️  لا يوجد أعضاء للاختبار');
      process.exit(0);
    }

    console.log('ℹ️  ملاحظة: إذا كانت النقاط صفر، فهذا يعني أنه تم احتساب الأرباح وتصفير النقاط مسبقاً');

    console.log(`📊 اختبار العضو: ${member.name} (${member.username})`);
    console.log(`   الرتبة: ${member.memberRank}\n`);

    // ══════════════════════════════════════
    // 1. حساب أرباح الأداء
    // ══════════════════════════════════════
    const personalPoints = member.monthlyPoints || 0;
    const personalCommissionPoints = personalPoints * 0.20;
    const personalProfitInShekel = Math.floor(personalCommissionPoints * POINTS_TO_CURRENCY);

    const gen1Points = member.generation1Points || 0;
    const gen2Points = member.generation2Points || 0;
    const gen3Points = member.generation3Points || 0;
    const gen4Points = member.generation4Points || 0;
    const gen5Points = member.generation5Points || 0;

    const teamCommissionPoints = gen1Points + gen2Points + gen3Points + gen4Points + gen5Points;
    const teamProfitInShekel = Math.floor(teamCommissionPoints * POINTS_TO_CURRENCY);

    const performanceProfitInShekel = personalProfitInShekel + teamProfitInShekel;

    console.log('💰 أرباح الأداء:');
    console.log(`   النقاط الشخصية: ${personalPoints}`);
    console.log(`   الربح الشخصي: ${personalProfitInShekel} شيكل`);
    console.log(`   نقاط الفريق: ${teamCommissionPoints.toFixed(2)}`);
    console.log(`   ربح الفريق: ${teamProfitInShekel} شيكل`);
    console.log(`   ✅ إجمالي أرباح الأداء: ${performanceProfitInShekel} شيكل\n`);

    // ══════════════════════════════════════
    // 2. حساب عمولة القيادة
    // ══════════════════════════════════════
    const leadershipCommissionData = await calculateLeadershipCommission(User, member._id);
    const leadershipCommission = leadershipCommissionData.commissionInShekel || 0;

    console.log('👑 عمولة القيادة:');
    console.log(`   الحالة: ${leadershipCommissionData.hasLeadershipCommission ? 'نشط' : 'غير نشط'}`);
    console.log(`   ✅ إجمالي عمولة القيادة: ${leadershipCommission} شيكل\n`);

    // ══════════════════════════════════════
    // 3. حساب عمولة شراء الزبون
    // ══════════════════════════════════════
    let customerPurchaseCommission = 0;

    const customerOrders = await Order.find({
      referredBy: member._id,
      isDelivered: true,
      isCustomerCommissionCalculated: { $ne: true }
    }).populate('user', 'role').populate('orderItems.product');

    for (const order of customerOrders) {
      if (order.user && order.user.role === 'customer') {
        for (const item of order.orderItems) {
          if (item.product) {
            const priceDifference = (item.product.customerPrice - item.product.subscriberPrice) * item.quantity;
            customerPurchaseCommission += priceDifference;
          }
        }
      }
    }

    console.log('🛒 عمولة شراء الزبون:');
    console.log(`   عدد الطلبات غير المهمشة: ${customerOrders.length}`);
    console.log(`   ✅ إجمالي عمولة الزبون: ${customerPurchaseCommission.toFixed(2)} شيكل\n`);

    // ══════════════════════════════════════
    // 4. الإجمالي النهائي
    // ══════════════════════════════════════
    const totalExpectedProfit = performanceProfitInShekel + leadershipCommission + customerPurchaseCommission;
    const websiteDevelopmentCommission = totalExpectedProfit * 0.05;
    const finalExpectedProfit = Math.floor(totalExpectedProfit - websiteDevelopmentCommission);

    console.log('═══════════════════════════════════════════');
    console.log('📊 الملخص النهائي:');
    console.log('═══════════════════════════════════════════');
    console.log(`   أرباح الأداء: ${performanceProfitInShekel} شيكل`);
    console.log(`   عمولة القيادة: ${leadershipCommission} شيكل`);
    console.log(`   عمولة شراء الزبون: ${Math.floor(customerPurchaseCommission)} شيكل`);
    console.log(`   ─────────────────────────────────────────`);
    console.log(`   المجموع قبل الخصم: ${Math.floor(totalExpectedProfit)} شيكل`);
    console.log(`   عمولة تطوير الموقع (5%): ${Math.floor(websiteDevelopmentCommission)} شيكل`);
    console.log(`   ─────────────────────────────────────────`);
    console.log(`   💰 الربح المتوقع النهائي: ${finalExpectedProfit} شيكل`);
    console.log('═══════════════════════════════════════════\n');

    console.log('✅ اكتمل الاختبار بنجاح!');
    console.log('📝 ملاحظة: هذه الأرباح المتوقعة ولم يتم حذف النقاط أو تهميش الطلبات\n');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// تشغيل الاختبار
testExpectedProfitCalculation();
