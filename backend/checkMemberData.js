/**
 * فحص بيانات الأعضاء الذين تأثروا بإعادة الحساب
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkMemberData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ اتصال بقاعدة البيانات نجح\n');

    const usernames = ['ghgh', 'ggg', 'jkjk', 't'];

    for (const username of usernames) {
      const user = await User.findOne({ username }).lean();

      if (!user) {
        console.log(`❌ المستخدم ${username} غير موجود\n`);
        continue;
      }

      console.log('='.repeat(70));
      console.log(`👤 ${user.name} (@${user.username})`);
      console.log('='.repeat(70));
      console.log(`الرتبة: ${user.memberRank || user.rank || 'غير محددة'}`);
      console.log(`الدور: ${user.role}`);

      console.log('\n📊 النقاط:');
      console.log(`  النقاط الشخصية: ${user.personalPoints || 0}`);
      console.log(`  نقاط الفريق: ${user.teamPoints || 0}`);
      console.log(`  نقاط القيادة: ${user.leadershipPoints || 0}`);

      console.log('\n📈 نقاط الأجيال:');
      for (let i = 1; i <= 5; i++) {
        const points = user[`generation${i}Points`] || 0;
        console.log(`  جيل ${i}: ${points}`);
      }

      console.log('\n💰 الأرباح:');
      console.log(`  إجمالي العمولة: ${user.totalCommission || 0} شيكل`);
      console.log(`  العمولة المتاحة: ${user.availableCommission || 0} شيكل`);

      // حساب عمولة القيادة المتوقعة
      const LEADERSHIP_RATES = {
        'agent': [],
        'bronze': [0.05],
        'silver': [0.05, 0.04],
        'gold': [0.05, 0.04, 0.03],
        'ruby': [0.05, 0.04, 0.03, 0.02],
        'diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
      };

      const rank = user.memberRank || 'agent';
      const rates = LEADERSHIP_RATES[rank] || [];

      console.log('\n🔍 حساب عمولة القيادة المتوقعة:');
      console.log(`  الرتبة: ${rank.toUpperCase()}`);
      console.log(`  عدد الأجيال المستحقة: ${rates.length}`);

      let expectedLeadershipPoints = 0;
      for (let i = 0; i < rates.length; i++) {
        const genPoints = user[`generation${i + 1}Points`] || 0;
        const rate = rates[i];
        const leadershipPoints = genPoints * rate;

        if (genPoints > 0) {
          console.log(`  جيل ${i + 1}: ${genPoints} × ${(rate * 100)}% = ${leadershipPoints.toFixed(2)} نقطة قيادة`);
        }

        expectedLeadershipPoints += leadershipPoints;
      }

      const expectedCommission = Math.floor(expectedLeadershipPoints * 0.55);
      const currentCommission = Math.floor((user.leadershipPoints || 0) * 0.55);

      console.log(`\n  📊 إجمالي نقاط القيادة المتوقعة: ${expectedLeadershipPoints.toFixed(2)}`);
      console.log(`  💰 عمولة القيادة المتوقعة: ${expectedCommission} شيكل`);
      console.log(`  💰 عمولة القيادة الحالية: ${currentCommission} شيكل`);
      console.log(`  ${expectedCommission > currentCommission ? '📈' : '📉'} الفرق: ${expectedCommission - currentCommission} شيكل`);

      console.log('\n');
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkMemberData();
