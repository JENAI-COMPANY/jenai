/**
 * التحقق من حساب عمولة القيادة للعضو T (ياقوتي)
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const { calculateLeadershipCommission, getDownlineStructure } = require('./config/memberRanks');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jenai')
  .then(() => console.log('✅ متصل بقاعدة البيانات'))
  .catch(err => console.error('❌ خطأ في الاتصال:', err));

async function checkTCommission() {
  try {
    console.log('\n🔍 ══════════════════════════════════════════════════');
    console.log('   التحقق من عمولة القيادة للعضو T (ياقوتي)');
    console.log('══════════════════════════════════════════════════\n');

    // جلب العضو T
    const memberT = await User.findOne({ username: 't' });

    if (!memberT) {
      console.error('❌ لم يتم العثور على العضو T');
      return;
    }

    console.log(`👤 العضو: ${memberT.name}`);
    console.log(`🏆 الرتبة: ${memberT.memberRank}`);
    console.log(`📊 النقاط الشهرية: ${memberT.monthlyPoints || 0}`);
    console.log(`💎 عمولة القيادة المحفوظة: ${memberT.leadershipPoints || 0} نقطة\n`);

    // جلب هيكل الشبكة
    console.log('📋 جلب هيكل الشبكة...\n');
    const downlineStructure = await getDownlineStructure(User, memberT._id);

    // عرض الأجيال
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 تفاصيل الأجيال:');
    console.log('═══════════════════════════════════════════════════\n');

    for (let i = 1; i <= 5; i++) {
      const levelKey = `level${i}`;
      const levelMembers = downlineStructure[levelKey] || [];

      console.log(`\n${'─'.repeat(50)}`);
      console.log(`🔹 الجيل ${i}: ${levelMembers.length} عضو`);
      console.log(`${'─'.repeat(50)}`);

      if (levelMembers.length > 0) {
        let totalMonthlyPoints = 0;

        levelMembers.forEach(member => {
          const monthlyPoints = member.monthlyPoints || 0;
          totalMonthlyPoints += monthlyPoints;
          console.log(`   • ${member.name} (@${member.username}): ${monthlyPoints} نقطة شهرية`);
        });

        console.log(`\n   📌 إجمالي النقاط الشهرية للجيل ${i}: ${totalMonthlyPoints}`);
      } else {
        console.log('   (لا يوجد أعضاء)');
      }
    }

    // حساب عمولة القيادة
    console.log('\n\n═══════════════════════════════════════════════════');
    console.log('💰 حساب عمولة القيادة:');
    console.log('═══════════════════════════════════════════════════\n');

    const leadershipData = await calculateLeadershipCommission(User, memberT._id);

    console.log(`📊 إجمالي نقاط عمولة القيادة: ${leadershipData.totalCommissionPoints?.toFixed(2) || 0} نقطة`);
    console.log(`💵 القيمة بالشيكل: ${leadershipData.commissionInShekel || 0} شيكل`);
    console.log(`✅ له عمولة قيادة: ${leadershipData.hasLeadershipCommission ? 'نعم' : 'لا'}\n`);

    if (leadershipData.breakdown && leadershipData.breakdown.length > 0) {
      console.log('📋 التفصيل حسب الجيل:');
      console.log('─'.repeat(80));
      console.log(`${'الجيل'.padEnd(10)} ${'نقاط الجيل'.padEnd(15)} ${'النسبة'.padEnd(10)} ${'نقاط العمولة'.padEnd(20)} ${'القيمة بالشيكل'.padEnd(20)}`);
      console.log('─'.repeat(80));

      leadershipData.breakdown.forEach(item => {
        console.log(
          `${String(item.generation).padEnd(10)} ` +
          `${String(item.generationPoints).padEnd(15)} ` +
          `${item.commissionRatePercent.padEnd(10)} ` +
          `${item.commissionPoints.toFixed(2).padEnd(20)} ` +
          `${String(item.commissionInShekel).padEnd(20)}`
        );
      });
      console.log('─'.repeat(80));
    }

    // المقارنة
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 المقارنة:');
    console.log('═══════════════════════════════════════════════════\n');

    const currentStored = memberT.leadershipPoints || 0;
    const calculated = leadershipData.totalCommissionPoints || 0;
    const difference = calculated - currentStored;

    console.log(`   المحفوظ حالياً: ${currentStored.toFixed(2)} نقطة (${Math.floor(currentStored * 0.55)} شيكل)`);
    console.log(`   المحسوب الآن: ${calculated.toFixed(2)} نقطة (${Math.floor(calculated * 0.55)} شيكل)`);
    console.log(`   الفرق: ${difference.toFixed(2)} نقطة (${Math.floor(difference * 0.55)} شيكل)`);

    if (Math.abs(difference) > 0.01) {
      console.log(`\n   ⚠️  يوجد اختلاف! يجب تحديث البيانات`);
    } else {
      console.log(`\n   ✅ الحساب متطابق`);
    }

    console.log('\n═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق الاتصال\n');
    process.exit(0);
  }
}

checkTCommission();
