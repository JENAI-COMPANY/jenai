const mongoose = require('mongoose');
const User = require('./models/User');

// الاتصال بقاعدة البيانات
mongoose.connect('mongodb://104.218.48.119:27017/network-marketing', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Connected to database');

  try {
    // جلب ggg و ghgh
    const ggg = await User.findOne({ username: 'ggg' });
    const ghgh = await User.findOne({ username: 'ghgh' });

    if (!ggg || !ghgh) {
      console.error('❌ لم يتم العثور على ggg أو ghgh');
      process.exit(1);
    }

    console.log('\n📊 الحالة قبل التعديل:');
    console.log('ggg:', {
      monthlyPoints: ggg.monthlyPoints,
      referredBy: ggg.referredBy
    });
    console.log('ghgh:', {
      generation1Points: ghgh.generation1Points,
      generation2Points: ghgh.generation2Points,
      generation3Points: ghgh.generation3Points,
      generation4Points: ghgh.generation4Points,
      generation5Points: ghgh.generation5Points
    });

    // التحقق من الرابط
    console.log('\n🔗 التحقق من الرابط:');
    console.log('ggg.referredBy:', ggg.referredBy?.toString());
    console.log('ghgh._id:', ghgh._id.toString());
    console.log('متطابق؟', ggg.referredBy?.toString() === ghgh._id.toString());

    // إضافة 200 نقطة لـ ggg
    console.log('\n➕ إضافة 200 نقطة لـ ggg...');
    ggg.monthlyPoints = 200;
    await ggg.save();
    console.log('✅ تم حفظ ggg');

    // توزيع نقاط الأجيال يدوياً (كما يجب أن يحدث تلقائياً)
    console.log('\n📤 توزيع نقاط الأجيال...');
    const GENERATION_RATES = [0.11, 0.08, 0.06, 0.03, 0.02];

    let currentMemberId = ggg.referredBy;
    let generationLevel = 0;

    while (currentMemberId && generationLevel < 5) {
      const currentMember = await User.findById(currentMemberId);

      if (!currentMember || currentMember.role !== 'member') {
        console.log(`❌ توقف عند الجيل ${generationLevel + 1}: العضو غير موجود أو ليس member`);
        break;
      }

      const genRate = GENERATION_RATES[generationLevel];
      const genPoints = 200 * genRate;
      const genFieldName = `generation${generationLevel + 1}Points`;

      currentMember[genFieldName] = (currentMember[genFieldName] || 0) + genPoints;
      await currentMember.save();

      console.log(`  ✅ ${currentMember.name} (جيل ${generationLevel + 1}): +${genPoints} نقطة → ${currentMember[genFieldName]}`);

      currentMemberId = currentMember.referredBy;
      generationLevel++;
    }

    // إعادة جلب البيانات
    const gggAfter = await User.findOne({ username: 'ggg' });
    const ghghAfter = await User.findOne({ username: 'ghgh' });

    console.log('\n📊 الحالة بعد التعديل:');
    console.log('ggg:', {
      monthlyPoints: gggAfter.monthlyPoints
    });
    console.log('ghgh:', {
      generation1Points: ghghAfter.generation1Points,
      generation2Points: ghghAfter.generation2Points,
      generation3Points: ghghAfter.generation3Points,
      generation4Points: ghghAfter.generation4Points,
      generation5Points: ghghAfter.generation5Points
    });

    console.log('\n✅ انتهى التشخيص');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ فشل الاتصال بقاعدة البيانات:', err);
  process.exit(1);
});
