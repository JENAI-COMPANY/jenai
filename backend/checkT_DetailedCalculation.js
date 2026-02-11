const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const ProfitPeriod = require('./models/ProfitPeriod');
  const User = require('./models/User');

  const period = await ProfitPeriod.findOne({ periodName: '99' }).lean();
  const tMember = period.membersProfits.find(m => m.username && m.username.toLowerCase() === 't');

  console.log('========================================');
  console.log('تفصيل حساب عمولة القيادة للعضو T في فترة 99');
  console.log('========================================\n');

  console.log('النقاط حسب الأجيال:');
  console.log(`  الجيل 1: ${tMember.points.generation1} نقطة`);
  console.log(`  الجيل 2: ${tMember.points.generation2} نقطة`);
  console.log(`  الجيل 3: ${tMember.points.generation3} نقطة`);
  console.log(`  الجيل 4: ${tMember.points.generation4} نقطة`);

  console.log('\n⚠️  ملاحظة: النقاط المخزنة في الفترة هي نقاط الأجيال (بعد نسب 11%, 8%, 6%, 3%)');
  console.log('    ولكن عمولة القيادة تحسب من النقاط الشخصية للأعضاء في الفريق\n');

  // نحتاج النقاط الشخصية لحساب عمولة القيادة
  // نسب عمولة القيادة للياقوتي: 5%, 4%, 3%, 2%

  console.log('نسب عمولة القيادة للياقوتي (Ruby):');
  console.log('  الجيل 1: 5%');
  console.log('  الجيل 2: 4%');
  console.log('  الجيل 3: 3%');
  console.log('  الجيل 4: 2%\n');

  console.log('========================================');
  console.log('الطريقة الحالية (تقريب كل جيل ثم جمع):');
  console.log('========================================');

  const leadershipPoints = tMember.commissions.leadership.totalCommissionPoints;
  console.log(`إجمالي نقاط عمولة القيادة: ${leadershipPoints}`);

  // إذا كانت النقاط مقسمة على أجيال، نحتاج معرفة النقاط الشخصية لكل جيل
  // لكن الكود الحالي يجمع النقاط ككل
  
  console.log(`التحويل إلى شيكل: ${leadershipPoints} × 0.55 = ${leadershipPoints * 0.55}`);
  console.log(`بعد التقريب (Math.floor): ${Math.floor(leadershipPoints * 0.55)} شيكل`);
  console.log(`المسجل في الفترة: ${tMember.commissions.leadership.commissionInShekel} شيكل\n`);

  console.log('========================================');
  console.log('التفصيل من البيانات المخزنة:');
  console.log('========================================');

  const totalBeforeDeduction = tMember.profit.totalProfitBeforeDeduction;
  const websiteCommission = tMember.profit.websiteDevelopmentCommission;
  const finalProfit = tMember.profit.totalProfit;

  console.log(`✅ ربح الأداء: ${tMember.profit.performanceProfit} شيكل`);
  console.log(`✅ ربح القيادة: ${tMember.profit.leadershipProfit} شيكل`);
  console.log(`✅ عمولة شراء زبون: ${tMember.profit.customerPurchaseCommission} شيكل`);
  console.log(`   ─────────────────────────────────────`);
  console.log(`   المجموع قبل الخصم: ${totalBeforeDeduction} شيكل`);
  console.log(`   خصم تطوير الموقع (3%): ${websiteCommission} شيكل`);
  console.log(`   ─────────────────────────────────────`);
  console.log(`   الإجمالي النهائي: ${finalProfit} شيكل\n`);

  console.log('========================================');
  console.log('التحقق من الحساب:');
  console.log('========================================');

  const calculatedBeforeDeduction = tMember.profit.performanceProfit + tMember.profit.leadershipProfit + tMember.profit.customerPurchaseCommission;
  console.log(`الحساب: ${tMember.profit.performanceProfit} + ${tMember.profit.leadershipProfit} + ${tMember.profit.customerPurchaseCommission} = ${calculatedBeforeDeduction}`);
  console.log(`المخزن: ${totalBeforeDeduction}`);
  console.log(`✅ ${calculatedBeforeDeduction === totalBeforeDeduction ? 'متطابق' : 'غير متطابق'}\n`);

  const calculatedWebsiteCommission = totalBeforeDeduction * 0.03;
  console.log(`خصم الموقع: ${totalBeforeDeduction} × 3% = ${calculatedWebsiteCommission}`);
  console.log(`المخزن: ${websiteCommission}`);
  console.log(`✅ ${calculatedWebsiteCommission === websiteCommission ? 'متطابق' : 'غير متطابق'}\n`);

  const calculatedFinal = totalBeforeDeduction - websiteCommission;
  console.log(`النهائي: ${totalBeforeDeduction} - ${websiteCommission} = ${calculatedFinal}`);
  console.log(`المخزن: ${finalProfit}`);
  console.log(`✅ ${calculatedFinal === finalProfit ? 'متطابق' : 'غير متطابق'}\n`);

  console.log('========================================');
  console.log('خلاصة المشكلة:');
  console.log('========================================');
  console.log(`العملية الحالية في profitPeriodController.js (سطر 156):`);
  console.log(`  const finalProfit = Math.floor(memberTotalProfit - websiteDevelopmentCommission);`);
  console.log(`\nهذا صحيح! التقريب يحدث في النهاية فقط.`);
  console.log(`\nإذن المشكلة ليست في التقريب، بل ربما في:`);
  console.log(`  1. حساب نقاط عمولة القيادة نفسها`);
  console.log(`  2. أو في تغيير النقاط/الفريق بعد احتساب الفترة\n`);

  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
