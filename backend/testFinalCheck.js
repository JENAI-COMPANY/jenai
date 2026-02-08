const mongoose = require('mongoose');
const User = require('./models/User');

// نسخة من دالة distributeCommissions
async function distributeCommissions(buyer, productPoints) {
  buyer.points = (buyer.points || 0) + productPoints;
  buyer.monthlyPoints = (buyer.monthlyPoints || 0) + productPoints;
  await buyer.save();

  const GENERATION_RATES = [0.11, 0.08, 0.06, 0.03, 0.02];
  let currentMemberId = buyer.referredBy;
  let generationLevel = 0;

  while (currentMemberId && generationLevel < 5) {
    const currentMember = await User.findById(currentMemberId);
    if (!currentMember || currentMember.role !== 'member') break;

    const genRate = GENERATION_RATES[generationLevel];
    const genPoints = productPoints * genRate;
    const genFieldName = `generation${generationLevel + 1}Points`;

    currentMember[genFieldName] = (currentMember[genFieldName] || 0) + genPoints;
    await currentMember.save();

    currentMemberId = currentMember.referredBy;
    generationLevel++;
  }
}

mongoose.connect('mongodb://104.218.48.119:27017/jenai_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ متصل بقاعدة البيانات jenai_db\n');

  try {
    // جلب المستخدم للاختبار
    const testUser = await User.findOne({ username: 'ggg' });
    if (!testUser) {
      console.error('❌ لم يتم العثور على المستخدم ggg');
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('           اختبار نهائي للنقاط المكافأة والتعويض');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📊 الحالة الأولية للمستخدم:', testUser.name);
    console.log('  ├─ النقاط التراكمية (points):', testUser.points || 0);
    console.log('  ├─ نقاط الأداء الشخصي (monthlyPoints):', testUser.monthlyPoints || 0);
    console.log('  ├─ نقاط المكافأة (bonusPoints):', testUser.bonusPoints || 0);
    console.log('  └─ نقاط التعويض (compensationPoints):', testUser.compensationPoints || 0);

    const initial = {
      points: testUser.points || 0,
      monthlyPoints: testUser.monthlyPoints || 0,
      bonusPoints: testUser.bonusPoints || 0,
      compensationPoints: testUser.compensationPoints || 0
    };

    // اختبار 1: نقاط المكافأة
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('🧪 اختبار 1: إضافة 50 نقطة مكافأة');
    console.log('───────────────────────────────────────────────────────────');
    console.log('المتوقع:');
    console.log('  ✓ النقاط التراكمية +50');
    console.log('  ✓ نقاط الأداء الشخصي +50');
    console.log('  ✓ توزيع على الأجيال العليا\n');

    testUser.bonusPoints = (testUser.bonusPoints || 0) + 50;
    await testUser.save();
    await distributeCommissions(testUser, 50);

    const afterBonus = await User.findOne({ username: 'ggg' });

    console.log('النتيجة:');
    console.log('  ├─ النقاط التراكمية:', initial.points, '→', afterBonus.points || 0,
      `(${(afterBonus.points || 0) > initial.points ? '✅ +' + ((afterBonus.points || 0) - initial.points) : '❌'})`);
    console.log('  ├─ نقاط الأداء الشخصي:', initial.monthlyPoints, '→', afterBonus.monthlyPoints || 0,
      `(${(afterBonus.monthlyPoints || 0) > initial.monthlyPoints ? '✅ +' + ((afterBonus.monthlyPoints || 0) - initial.monthlyPoints) : '❌'})`);
    console.log('  └─ نقاط المكافأة:', initial.bonusPoints, '→', afterBonus.bonusPoints || 0);

    const afterBonusValues = {
      points: afterBonus.points || 0,
      monthlyPoints: afterBonus.monthlyPoints || 0
    };

    // اختبار 2: نقاط التعويض
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('🧪 اختبار 2: إضافة 30 نقطة تعويض');
    console.log('───────────────────────────────────────────────────────────');
    console.log('المتوقع:');
    console.log('  ✓ النقاط التراكمية +30');
    console.log('  ✗ نقاط الأداء الشخصي بدون تغيير');
    console.log('  ✗ بدون توزيع على الأجيال\n');

    afterBonus.compensationPoints = (afterBonus.compensationPoints || 0) + 30;
    afterBonus.points = (afterBonus.points || 0) + 30;
    await afterBonus.save();

    const afterCompensation = await User.findOne({ username: 'ggg' });

    console.log('النتيجة:');
    console.log('  ├─ النقاط التراكمية:', afterBonusValues.points, '→', afterCompensation.points || 0,
      `(${(afterCompensation.points || 0) > afterBonusValues.points ? '✅ +' + ((afterCompensation.points || 0) - afterBonusValues.points) : '❌'})`);
    console.log('  ├─ نقاط الأداء الشخصي:', afterBonusValues.monthlyPoints, '→', afterCompensation.monthlyPoints || 0,
      `(${(afterCompensation.monthlyPoints || 0) === afterBonusValues.monthlyPoints ? '✅ لم تتغير' : '❌ تغيرت'})`);
    console.log('  └─ نقاط التعويض:', initial.compensationPoints, '→', afterCompensation.compensationPoints || 0);

    // ملخص نهائي
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                      📊 الملخص النهائي');
    console.log('═══════════════════════════════════════════════════════════\n');

    const totalPointsIncrease = (afterCompensation.points || 0) - initial.points;
    const totalMonthlyIncrease = (afterCompensation.monthlyPoints || 0) - initial.monthlyPoints;

    console.log('إجمالي التغييرات:');
    console.log('  ├─ النقاط التراكمية: +' + totalPointsIncrease, '(المتوقع: +80)');
    console.log('  └─ نقاط الأداء الشخصي: +' + totalMonthlyIncrease, '(المتوقع: +50)\n');

    const bonusOK = (afterBonus.points || 0) > initial.points &&
                    (afterBonus.monthlyPoints || 0) > initial.monthlyPoints;

    const compensationOK = (afterCompensation.points || 0) > afterBonusValues.points &&
                           (afterCompensation.monthlyPoints || 0) === afterBonusValues.monthlyPoints;

    if (bonusOK && compensationOK && totalPointsIncrease === 80 && totalMonthlyIncrease === 50) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('                    ✅ جميع الاختبارات نجحت!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  ✅ نقاط المكافأة: تضاف للتراكمي والأداء الشخصي');
      console.log('  ✅ نقاط التعويض: تضاف للتراكمي فقط');
      console.log('  ✅ جميع الحسابات صحيحة');
    } else {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('                     ❌ فشل بعض الاختبارات');
      console.log('═══════════════════════════════════════════════════════════');
      if (!bonusOK) console.log('  ❌ نقاط المكافأة لا تعمل بشكل صحيح');
      if (!compensationOK) console.log('  ❌ نقاط التعويض لا تعمل بشكل صحيح');
      if (totalPointsIncrease !== 80) console.log('  ❌ إجمالي النقاط التراكمية غير صحيح');
      if (totalMonthlyIncrease !== 50) console.log('  ❌ إجمالي نقاط الأداء الشخصي غير صحيح');
    }

    console.log('\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ فشل الاتصال بقاعدة البيانات:', err);
  process.exit(1);
});
