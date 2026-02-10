/**
 * إعادة حساب عمولة القيادة لجميع الأعضاء
 * بناءً على نقاط الأجيال الموجودة (generation1Points, generation2Points, etc.)
 *
 * السبب: كان هناك خطأ في LEADERSHIP_RATES (silver و gold مبدلين)
 * الآن بعد التعديل، نحتاج إعادة حساب عمولة القيادة الصحيحة
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// المعدلات الصحيحة بعد التعديل
const LEADERSHIP_RATES = {
  'agent': [],
  'bronze': [0.05], // برونزي: جيل 1 فقط - 5%
  'silver': [0.05, 0.04], // فضي: جيل 1+2 - 5% + 4%
  'gold': [0.05, 0.04, 0.03], // ذهبي: جيل 1+2+3 - 5% + 4% + 3%
  'ruby': [0.05, 0.04, 0.03, 0.02], // ياقوتي: جيل 1+2+3+4 - 5% + 4% + 3% + 2%
  'diamond': [0.05, 0.04, 0.03, 0.02, 0.01], // ماسي: جيل 1+2+3+4+5
  'double_diamond': [0.05, 0.04, 0.03, 0.02, 0.01],
  'regional_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01],
  'global_ambassador': [0.05, 0.04, 0.03, 0.02, 0.01]
};

const POINTS_TO_CURRENCY = 0.55;

async function recalculateLeadershipCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ اتصال بقاعدة البيانات نجح\n');

    // جلب جميع الأعضاء
    const members = await User.find({ role: 'member' });

    console.log('='.repeat(70));
    console.log(`📊 إعادة حساب عمولة القيادة لـ ${members.length} عضو`);
    console.log('='.repeat(70));

    let updatedCount = 0;
    let unchangedCount = 0;
    const changes = [];

    for (const member of members) {
      const rank = member.memberRank || 'agent';
      const leadershipRates = LEADERSHIP_RATES[rank] || [];

      // حساب عمولة القيادة بناءً على نقاط الأجيال الموجودة
      let newLeadershipPoints = 0;

      for (let i = 0; i < leadershipRates.length; i++) {
        const genFieldName = `generation${i + 1}Points`;
        const genPoints = member[genFieldName] || 0;
        const rate = leadershipRates[i];
        const leadershipPoints = genPoints * rate;

        newLeadershipPoints += leadershipPoints;
      }

      const oldLeadershipPoints = member.leadershipPoints || 0;
      const oldLeadershipCommission = Math.floor(oldLeadershipPoints * POINTS_TO_CURRENCY);
      const newLeadershipCommission = Math.floor(newLeadershipPoints * POINTS_TO_CURRENCY);

      // التحقق من وجود تغيير
      if (Math.abs(newLeadershipPoints - oldLeadershipPoints) > 0.01) {
        // حساب الفرق في الربح
        const commissionDiff = newLeadershipCommission - oldLeadershipCommission;
        const pointsDiff = newLeadershipPoints - oldLeadershipPoints;

        // تحديث العضو
        member.leadershipPoints = newLeadershipPoints;

        // تحديث الربح الإجمالي
        member.totalCommission = (member.totalCommission || 0) + commissionDiff;
        member.availableCommission = (member.availableCommission || 0) + commissionDiff;

        await member.save();

        changes.push({
          name: member.name,
          username: member.username,
          rank,
          oldPoints: oldLeadershipPoints.toFixed(2),
          newPoints: newLeadershipPoints.toFixed(2),
          pointsDiff: pointsDiff.toFixed(2),
          oldCommission: oldLeadershipCommission,
          newCommission: newLeadershipCommission,
          commissionDiff
        });

        updatedCount++;
      } else {
        unchangedCount++;
      }
    }

    console.log(`\n✅ تم التحديث: ${updatedCount} عضو`);
    console.log(`➖ بدون تغيير: ${unchangedCount} عضو`);

    if (changes.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('📋 التغييرات التي تمت:');
      console.log('='.repeat(70));

      changes.forEach((change, index) => {
        console.log(`\n${index + 1}. ${change.name} (@${change.username}) - ${change.rank.toUpperCase()}`);
        console.log(`   نقاط قيادة: ${change.oldPoints} → ${change.newPoints} (${change.pointsDiff > 0 ? '+' : ''}${change.pointsDiff})`);
        console.log(`   عمولة قيادة: ${change.oldCommission} شيكل → ${change.newCommission} شيكل (${change.commissionDiff > 0 ? '+' : ''}${change.commissionDiff} شيكل)`);
      });

      // ملخص إجمالي
      const totalDiff = changes.reduce((sum, c) => sum + c.commissionDiff, 0);
      console.log('\n' + '='.repeat(70));
      console.log('💰 إجمالي الفرق في العمولات');
      console.log('='.repeat(70));
      console.log(`${totalDiff > 0 ? '+' : ''}${totalDiff} شيكل`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ اكتملت عملية إعادة الحساب');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

recalculateLeadershipCommissions();
