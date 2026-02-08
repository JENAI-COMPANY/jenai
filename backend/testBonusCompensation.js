const mongoose = require('mongoose');
const User = require('./models/User');

// الاتصال بقاعدة البيانات
mongoose.connect('mongodb://104.218.48.119:27017/jenai_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ متصل بقاعدة البيانات jenai_db');

  try {
    // جلب المستخدم ggg للاختبار
    const testUser = await User.findOne({ username: 'ggg' });

    if (!testUser) {
      console.error('❌ لم يتم العثور على المستخدم ggg');
      process.exit(1);
    }

    console.log('\n📊 الحالة الأولية:');
    console.log('الاسم:', testUser.name);
    console.log('النقاط التراكمية (points):', testUser.points || 0);
    console.log('نقاط الأداء الشخصي (monthlyPoints):', testUser.monthlyPoints || 0);
    console.log('نقاط المكافأة (bonusPoints):', testUser.bonusPoints || 0);
    console.log('نقاط التعويض (compensationPoints):', testUser.compensationPoints || 0);

    // حفظ القيم الأولية
    const initialPoints = testUser.points || 0;
    const initialMonthlyPoints = testUser.monthlyPoints || 0;
    const initialBonusPoints = testUser.bonusPoints || 0;
    const initialCompensationPoints = testUser.compensationPoints || 0;

    console.log('\n🧪 اختبار 1: إضافة 100 نقطة مكافأة');
    console.log('المتوقع: زيادة النقاط التراكمية والأداء الشخصي بمقدار 100');

    // محاكاة إضافة نقاط مكافأة عبر API
    const bonusResponse = await fetch('http://localhost:5000/api/admin/users/' + testUser._id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bonusPoints: 100
      })
    });

    if (!bonusResponse.ok) {
      console.error('❌ فشل إضافة نقاط المكافأة');
      process.exit(1);
    }

    // إعادة جلب البيانات
    await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية
    const afterBonus = await User.findOne({ username: 'ggg' });

    console.log('\n📊 بعد إضافة نقاط المكافأة:');
    console.log('النقاط التراكمية (points):', afterBonus.points || 0,
      `(${(afterBonus.points || 0) > initialPoints ? '✅ زادت' : '❌ لم تزد'})`);
    console.log('نقاط الأداء الشخصي (monthlyPoints):', afterBonus.monthlyPoints || 0,
      `(${(afterBonus.monthlyPoints || 0) > initialMonthlyPoints ? '✅ زادت' : '❌ لم تزد'})`);
    console.log('نقاط المكافأة (bonusPoints):', afterBonus.bonusPoints || 0);

    // حفظ القيم بعد المكافأة
    const afterBonusPoints = afterBonus.points || 0;
    const afterBonusMonthlyPoints = afterBonus.monthlyPoints || 0;

    console.log('\n🧪 اختبار 2: إضافة 50 نقطة تعويض');
    console.log('المتوقع: زيادة النقاط التراكمية فقط بمقدار 50 (وليس الأداء الشخصي)');

    // محاكاة إضافة نقاط تعويض عبر API
    const compensationResponse = await fetch('http://localhost:5000/api/admin/users/' + testUser._id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compensationPoints: 50
      })
    });

    if (!compensationResponse.ok) {
      console.error('❌ فشل إضافة نقاط التعويض');
      process.exit(1);
    }

    // إعادة جلب البيانات
    await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية
    const afterCompensation = await User.findOne({ username: 'ggg' });

    console.log('\n📊 بعد إضافة نقاط التعويض:');
    console.log('النقاط التراكمية (points):', afterCompensation.points || 0,
      `(${(afterCompensation.points || 0) > afterBonusPoints ? '✅ زادت' : '❌ لم تزد'})`);
    console.log('نقاط الأداء الشخصي (monthlyPoints):', afterCompensation.monthlyPoints || 0,
      `(${(afterCompensation.monthlyPoints || 0) === afterBonusMonthlyPoints ? '✅ لم تتغير (صحيح)' : '❌ تغيرت (خطأ)'})`);
    console.log('نقاط التعويض (compensationPoints):', afterCompensation.compensationPoints || 0);

    console.log('\n📈 ملخص التغييرات:');
    console.log('━'.repeat(60));
    console.log('النقاط التراكمية:', initialPoints, '→', afterCompensation.points || 0,
      `(+${(afterCompensation.points || 0) - initialPoints})`);
    console.log('نقاط الأداء الشخصي:', initialMonthlyPoints, '→', afterCompensation.monthlyPoints || 0,
      `(+${(afterCompensation.monthlyPoints || 0) - initialMonthlyPoints})`);
    console.log('نقاط المكافأة:', initialBonusPoints, '→', afterCompensation.bonusPoints || 0,
      `(+${(afterCompensation.bonusPoints || 0) - initialBonusPoints})`);
    console.log('نقاط التعويض:', initialCompensationPoints, '→', afterCompensation.compensationPoints || 0,
      `(+${(afterCompensation.compensationPoints || 0) - initialCompensationPoints})`);

    console.log('\n✅ النتيجة النهائية:');
    const bonusWorksCorrectly =
      (afterBonus.points || 0) > initialPoints &&
      (afterBonus.monthlyPoints || 0) > initialMonthlyPoints;
    const compensationWorksCorrectly =
      (afterCompensation.points || 0) > afterBonusPoints &&
      (afterCompensation.monthlyPoints || 0) === afterBonusMonthlyPoints;

    if (bonusWorksCorrectly && compensationWorksCorrectly) {
      console.log('✅ جميع الاختبارات نجحت!');
      console.log('  ✅ نقاط المكافأة تضيف للنقاط التراكمية والأداء الشخصي');
      console.log('  ✅ نقاط التعويض تضيف للنقاط التراكمية فقط');
    } else {
      console.log('❌ بعض الاختبارات فشلت:');
      if (!bonusWorksCorrectly) {
        console.log('  ❌ نقاط المكافأة لا تعمل بشكل صحيح');
      }
      if (!compensationWorksCorrectly) {
        console.log('  ❌ نقاط التعويض لا تعمل بشكل صحيح');
      }
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ فشل الاتصال بقاعدة البيانات:', err);
  process.exit(1);
});
