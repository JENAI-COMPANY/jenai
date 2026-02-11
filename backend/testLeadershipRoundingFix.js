const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('========================================');
  console.log('اختبار إصلاح تقريب عمولة القيادة');
  console.log('========================================\n');

  const User = require('./models/User');
  const { calculateLeadershipCommission } = require('./config/memberRanks');

  // البحث عن العضو T
  const tUser = await User.findOne({ username: 't' });
  
  if (!tUser) {
    console.log('❌ لم يتم العثور على العضو T');
    mongoose.disconnect();
    return;
  }

  console.log(`✅ العضو: ${tUser.name} (@${tUser.username})`);
  console.log(`   الرتبة: ${tUser.memberRank}`);
  console.log(`   النقاط الشهرية: ${tUser.monthlyPoints}\n`);

  // حساب عمولة القيادة 3 مرات للتأكد من الثبات
  console.log('🔄 اختبار ثبات الحساب (3 مرات متتالية):\n');

  const results = [];
  for (let i = 1; i <= 3; i++) {
    const result = await calculateLeadershipCommission(User, tUser._id);
    results.push(result);
    
    console.log(`المحاولة ${i}:`);
    console.log(`  النقاط: ${result.totalCommissionPoints}`);
    console.log(`  الشيكل: ${result.commissionInShekel}`);
    
    if (result.breakdown && result.breakdown.length > 0) {
      console.log(`  التفصيل:`);
      result.breakdown.forEach(gen => {
        console.log(`    الجيل ${gen.generation}: ${gen.generationPoints} نقطة × ${gen.commissionRatePercent} = ${gen.commissionPoints} نقطة → ${gen.commissionInShekel} شيكل`);
      });
    }
    console.log();
  }

  console.log('========================================');
  console.log('التحقق من الثبات:');
  console.log('========================================');

  const allSame = results.every(r => 
    r.commissionInShekel === results[0].commissionInShekel &&
    r.totalCommissionPoints === results[0].totalCommissionPoints
  );

  if (allSame) {
    console.log('✅ جميع الحسابات متطابقة - لا يوجد فرق شيكل!');
  } else {
    console.log('❌ يوجد اختلاف في الحسابات:');
    results.forEach((r, i) => {
      console.log(`   المحاولة ${i + 1}: ${r.commissionInShekel} شيكل`);
    });
  }

  console.log('\n========================================');
  console.log('التحقق من صحة الحساب اليدوي:');
  console.log('========================================');

  const result = results[0];
  let manualTotal = 0;
  console.log('حساب يدوي:');
  result.breakdown.forEach(gen => {
    const points = gen.commissionPoints;
    manualTotal += points;
    console.log(`  الجيل ${gen.generation}: ${points} نقطة`);
  });
  
  console.log(`  ──────────────────────────────`);
  console.log(`  المجموع: ${manualTotal} نقطة`);
  console.log(`  × 0.55 = ${manualTotal * 0.55}`);
  console.log(`  Math.floor = ${Math.floor(manualTotal * 0.55)} شيكل`);
  console.log(`\n  النتيجة من الدالة: ${result.commissionInShekel} شيكل`);
  console.log(`  ${Math.floor(manualTotal * 0.55) === result.commissionInShekel ? '✅ متطابق' : '❌ غير متطابق'}`);

  mongoose.disconnect();
  console.log('\n✅ تم الانتهاء');
}).catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
