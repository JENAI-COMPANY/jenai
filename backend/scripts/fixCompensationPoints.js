const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jenai-network')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const User = require('../models/User');

async function fixCompensationPoints() {
  try {
    console.log('🔧 إصلاح توزيع نقاط التعويض...\n');

    // جلب مصطفى
    const mostafa = await User.findOne({ subscriberCode: 'PG826155' });
    if (!mostafa) {
      console.log('❌ لم يتم العثور على مصطفى');
      return;
    }

    console.log(`✅ وجدنا ${mostafa.name}`);
    console.log(`   - نقاط التعويض: ${mostafa.compensationPoints || 0}`);

    // النقاط اللي ناقصة للتوزيع = 232
    const pointsToDistribute = 232;

    // توزيع على الأعضاء فوقه
    let currentMemberId = mostafa.referredBy || mostafa.sponsorId;
    let generationLevel = 0;

    console.log(`\n📊 توزيع ${pointsToDistribute} نقطة على الأعضاء العلويين:\n`);

    while (currentMemberId && generationLevel < 5) {
      const currentMember = await User.findById(currentMemberId);

      if (!currentMember || currentMember.role !== 'member') {
        console.log(`⚠️ توقفنا عند: ${currentMember ? currentMember.name : 'عضو غير موجود'}`);
        break;
      }

      const oldPoints = currentMember.points || 0;
      currentMember.points = oldPoints + pointsToDistribute;
      await currentMember.save();

      console.log(`✅ ${currentMember.name} (${currentMember.subscriberCode})`);
      console.log(`   - النقاط: ${oldPoints} → ${currentMember.points} (+${pointsToDistribute})`);

      currentMemberId = currentMember.referredBy || currentMember.sponsorId;
      generationLevel++;
    }

    console.log(`\n✅ تم توزيع النقاط على ${generationLevel} جيل`);

    // التحقق من النتيجة النهائية
    console.log('\n\n📊 التحقق من النتائج:');
    const codes = ['PG180010', 'PG267267', 'PG681552']; // ناريمان، رنا، ايمان
    for (const code of codes) {
      const user = await User.findOne({ subscriberCode: code });
      if (user) {
        console.log(`${user.name} (${code}): ${user.points} نقطة`);
      }
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ تم الانتهاء');
    process.exit(0);
  }
}

fixCompensationPoints();
