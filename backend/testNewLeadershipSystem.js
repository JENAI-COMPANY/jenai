/**
 * اختبار نظام عمولة القيادة الجديد
 * يحسب عمولة القيادة من مجموع النقاط الشخصية لأعضاء كل جيل
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { calculateLeadershipCommission, updateMemberLeadershipCommission } = require('./utils/calculateLeadershipCommission');

async function testNewLeadershipSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ اتصال بقاعدة البيانات نجح\n');

    console.log('='.repeat(70));
    console.log('🧪 اختبار نظام عمولة القيادة الجديد');
    console.log('='.repeat(70));

    // البحث عن جميع الأعضاء الذين لديهم رتبة (غير agent)
    const members = await User.find({
      role: 'member',
      memberRank: { $ne: 'agent', $exists: true }
    }).select('name username memberRank personalPoints leadershipPoints');

    console.log(`\n📊 وجدنا ${members.length} عضو لديهم رتبة\n`);

    if (members.length === 0) {
      console.log('⚠️ لا يوجد أعضاء برتبة لاختبارهم');
      console.log('💡 قم بترقية بعض الأعضاء أولاً أو انتظر حتى يصلوا لرتبة برونزي أو أعلى\n');
      return;
    }

    // اختبار حساب عمولة القيادة لكل عضو
    for (const member of members) {
      console.log('-'.repeat(70));
      console.log(`👤 ${member.name} (@${member.username}) - ${member.memberRank.toUpperCase()}`);
      console.log(`   النقاط الشخصية: ${member.personalPoints || 0}`);
      console.log(`   نقاط القيادة الحالية: ${member.leadershipPoints || 0}`);

      // حساب عمولة القيادة
      const newLeadershipPoints = await calculateLeadershipCommission(member._id);
      const newLeadershipCommission = Math.floor(newLeadershipPoints * 0.55);
      const oldLeadershipCommission = Math.floor((member.leadershipPoints || 0) * 0.55);

      console.log(`   نقاط القيادة الجديدة: ${newLeadershipPoints.toFixed(2)}`);
      console.log(`   عمولة القيادة الجديدة: ${newLeadershipCommission} شيكل`);
      console.log(`   الفرق: ${newLeadershipCommission - oldLeadershipCommission} شيكل`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('💡 ملاحظة:');
    console.log('='.repeat(70));
    console.log('عمولة القيادة تُحسب من مجموع النقاط الشخصية لأعضاء كل جيل:');
    console.log('  • برونزي: 5% من مجموع نقاط جيل 1');
    console.log('  • فضي: 5% من جيل 1 + 4% من جيل 2');
    console.log('  • ذهبي: 5% + 4% + 3% من أجيال 1+2+3');
    console.log('  • ياقوتي: 5% + 4% + 3% + 2% من أجيال 1+2+3+4');
    console.log('  • ماسي وما فوق: 5% + 4% + 3% + 2% + 1% من جميع الأجيال الخمسة');

    console.log('\n✅ الفائدة:');
    console.log('   حتى لو السوبر أدمن أضاف نقاط لعضو مباشرة (بدون طلب)،');
    console.log('   ستُحسب عمولة القيادة تلقائياً للأعضاء العلويين!\n');

    // سؤال المستخدم إذا كان يريد تحديث عمولة القيادة فعلياً
    console.log('='.repeat(70));
    console.log('⚠️ لتحديث عمولة القيادة فعلياً في قاعدة البيانات:');
    console.log('   استخدم: node backend/updateAllLeadershipCommissions.js');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

testNewLeadershipSystem();
