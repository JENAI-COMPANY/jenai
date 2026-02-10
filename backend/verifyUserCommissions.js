/**
 * التحقق من حسابات عمولة القيادة للمستخدم T (ياقوتي)
 * المشكلة: عمولة القيادة 360 شيكل لكن يجب أن تكون 843 شيكل
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');

const LEADERSHIP_RATES = {
  'agent': [],
  'bronze': [0.05],
  'silver': [0.05, 0.04],
  'gold': [0.05, 0.04, 0.03],
  'ruby': [0.05, 0.04, 0.03, 0.02],
  'diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
};

const POINTS_TO_CURRENCY = 0.55;

async function verifyUserCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ اتصال بقاعدة البيانات نجح\n');

    // البحث عن المستخدم T
    const userT = await User.findOne({ username: 't' }).lean();

    if (!userT) {
      console.log('❌ المستخدم T غير موجود');
      return;
    }

    console.log('='.repeat(70));
    console.log('👤 بيانات المستخدم T');
    console.log('='.repeat(70));
    console.log(`الاسم: ${userT.name}`);
    console.log(`اسم المستخدم: @${userT.username}`);
    console.log(`الرتبة: ${userT.memberRank || userT.rank || 'غير محددة'}`);
    console.log(`النقاط الشخصية: ${userT.personalPoints || 0}`);
    console.log(`نقاط الفريق: ${userT.teamPoints || 0}`);
    console.log(`عمولة القيادة (leadershipCommission): ${userT.leadershipCommission || 0} شيكل`);
    console.log(`نقاط القيادة (leadershipPoints): ${userT.leadershipPoints || 0}`);

    // نقاط الأجيال
    console.log('\n📊 نقاط الأجيال:');
    for (let i = 1; i <= 5; i++) {
      const genPoints = userT[`generation${i}Points`] || 0;
      console.log(`  جيل ${i}: ${genPoints} نقطة`);
    }

    // حساب عمولة القيادة المتوقعة
    console.log('\n' + '='.repeat(70));
    console.log('🔍 حساب عمولة القيادة المتوقعة (بناءً على الرتبة الحالية)');
    console.log('='.repeat(70));

    const currentRank = userT.memberRank || userT.rank || 'agent';
    const leadershipRates = LEADERSHIP_RATES[currentRank] || [];

    console.log(`الرتبة: ${currentRank.toUpperCase()}`);
    console.log(`عدد الأجيال المستحقة: ${leadershipRates.length}`);

    let totalLeadershipCommission = 0;

    // طريقة 1: بناءً على نقاط القيادة المخزنة
    if (userT.leadershipPoints > 0) {
      const commission = userT.leadershipPoints * POINTS_TO_CURRENCY;
      console.log(`\n💰 طريقة 1 (بناءً على leadershipPoints):
      ${userT.leadershipPoints} نقطة × 0.55 = ${commission.toFixed(2)} شيكل`);
      totalLeadershipCommission = commission;
    }

    // طريقة 2: حساب من نقاط الأجيال
    console.log(`\n💰 طريقة 2 (حساب من نقاط الأجيال):`);
    let calculatedCommission = 0;

    for (let i = 0; i < leadershipRates.length; i++) {
      const rate = leadershipRates[i];
      const genPoints = userT[`generation${i + 1}Points`] || 0;
      const commission = genPoints * rate * POINTS_TO_CURRENCY;

      console.log(`  جيل ${i + 1}: ${genPoints} نقطة × ${(rate * 100)}% × 0.55 = ${commission.toFixed(2)} شيكل`);
      calculatedCommission += commission;
    }

    console.log(`\n  📈 إجمالي عمولة القيادة المحسوبة: ${calculatedCommission.toFixed(2)} شيكل`);

    // المقارنة
    console.log('\n' + '='.repeat(70));
    console.log('📋 المقارنة');
    console.log('='.repeat(70));
    console.log(`المسجل في قاعدة البيانات: ${userT.leadershipCommission || 0} شيكل`);
    console.log(`المحسوب من leadershipPoints: ${totalLeadershipCommission.toFixed(2)} شيكل`);
    console.log(`المحسوب من نقاط الأجيال: ${calculatedCommission.toFixed(2)} شيكل`);
    console.log(`المتوقع (من الصورة): 843 شيكل`);

    const diff1 = 843 - (userT.leadershipCommission || 0);
    const diff2 = 843 - totalLeadershipCommission;
    const diff3 = 843 - calculatedCommission;

    console.log(`\nالفرق مع المتوقع:`);
    console.log(`  من المسجل: ${diff1.toFixed(2)} شيكل`);
    console.log(`  من leadershipPoints: ${diff2.toFixed(2)} شيكل`);
    console.log(`  من نقاط الأجيال: ${diff3.toFixed(2)} شيكل`);

    // البحث عن جميع الطلبات المتعلقة بفريق T
    console.log('\n' + '='.repeat(70));
    console.log('📦 تحليل طلبات الفريق');
    console.log('='.repeat(70));

    // البحث عن أعضاء الفريق (من أحال T أو أحالهم أعضاء فريق T)
    const allMembers = await User.find({ role: 'member' }).lean();

    // إيجاد أعضاء الفريق (حتى 5 أجيال)
    const teamMembers = [];

    function findTeamMembers(referrerId, level, maxLevel = 5) {
      if (level > maxLevel) return;

      const members = allMembers.filter(m =>
        m.referredBy && m.referredBy.toString() === referrerId.toString()
      );

      members.forEach(member => {
        teamMembers.push({ ...member, generation: level });
        findTeamMembers(member._id, level + 1, maxLevel);
      });
    }

    findTeamMembers(userT._id, 1);

    console.log(`عدد أعضاء الفريق: ${teamMembers.length}`);

    if (teamMembers.length > 0) {
      console.log('\nتوزيع الأجيال:');
      for (let i = 1; i <= 5; i++) {
        const count = teamMembers.filter(m => m.generation === i).length;
        console.log(`  جيل ${i}: ${count} أعضاء`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ التحليل اكتمل');
    console.log('='.repeat(70));

    // استنتاج
    console.log('\n💡 الاستنتاج:');
    if (Math.abs(diff3) < 10) {
      console.log('✅ الحسابات صحيحة تقريباً - الفرق ضمن الهامش المقبول');
    } else if (calculatedCommission < 843) {
      console.log('⚠️ عمولة القيادة المحسوبة أقل من المتوقع');
      console.log('   السبب المحتمل: قد تكون هناك طلبات لم يتم احتساب عمولة القيادة لها');
      console.log('   أو أن الرتبة تغيرت بعد بعض الطلبات');
    } else {
      console.log('📊 عمولة القيادة المحسوبة أعلى من المتوقع');
      console.log('   قد يكون هناك طلبات جديدة أو تحديث في النقاط');
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

verifyUserCommissions();
