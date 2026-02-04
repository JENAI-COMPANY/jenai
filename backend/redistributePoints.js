const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const redistributePoints = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://104.218.48.119:27017/jenai_db');
    console.log('✅ متصل بقاعدة البيانات');

    // النسب الثابتة لعمولة الأجيال
    const GENERATION_RATES = [0.11, 0.08, 0.06, 0.03, 0.02];

    // 1. تصفير نقاط الأجيال لجميع الأعضاء
    await User.updateMany(
      { role: 'member' },
      {
        $set: {
          generation1Points: 0,
          generation2Points: 0,
          generation3Points: 0,
          generation4Points: 0,
          generation5Points: 0,
          leadershipPoints: 0,
          points: 0
        }
      }
    );
    console.log('✅ تم تصفير نقاط الأجيال والنقاط التراكمية');

    // 2. الحصول على جميع الأعضاء الذين لديهم نقاط شهرية
    const members = await User.find({
      role: 'member',
      monthlyPoints: { $gt: 0 }
    }).lean();

    console.log(`📊 وجدنا ${members.length} عضو لديهم نقاط شهرية`);

    // 3. لكل عضو، نوزع نقاطه على الأعضاء فوقه
    for (const member of members) {
      const memberPoints = member.monthlyPoints || 0;
      if (memberPoints === 0) continue;

      console.log(`\n📊 توزيع ${memberPoints} نقطة من ${member.name}`);

      // إضافة النقاط للعضو نفسه
      await User.findByIdAndUpdate(member._id, {
        $inc: { points: memberPoints }
      });

      // توزيع على الأجيال الخمسة
      let currentMemberId = member.referredBy || member.sponsorId;
      let generationLevel = 0;

      while (currentMemberId && generationLevel < 5) {
        const currentMember = await User.findById(currentMemberId);
        if (!currentMember || currentMember.role !== 'member') break;

        // حساب نقاط الجيل (بالنسبة - للأرباح)
        const genRate = GENERATION_RATES[generationLevel];
        const genPoints = memberPoints * genRate;
        const genFieldName = `generation${generationLevel + 1}Points`;

        // تحديث نقاط الجيل (للأرباح) والنقاط التراكمية (كاملة)
        await User.findByIdAndUpdate(currentMember._id, {
          $inc: {
            [genFieldName]: genPoints,
            points: memberPoints // النقاط الكاملة
          }
        });

        console.log(`  └─ ${currentMember.name} (جيل ${generationLevel + 1}): +${genPoints.toFixed(2)} نقطة للأرباح, +${memberPoints} نقطة تراكمية`);

        currentMemberId = currentMember.referredBy || currentMember.sponsorId;
        generationLevel++;
      }
    }

    console.log('\n✅ تم إعادة توزيع جميع النقاط بنجاح');

    await mongoose.connection.close();
    console.log('✅ تم إغلاق الاتصال');
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
};

redistributePoints();
