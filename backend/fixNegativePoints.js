/**
 * سكريبت لتصليح النقاط السالبة في قاعدة البيانات
 * يجب تشغيله مرة واحدة فقط
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const fixNegativePoints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // البحث عن الأعضاء ذوي النقاط السالبة
    const membersWithNegativePoints = await User.find({
      role: 'member',
      points: { $lt: 0 }
    });

    console.log(`\n📊 Found ${membersWithNegativePoints.length} members with negative points\n`);

    for (const member of membersWithNegativePoints) {
      console.log(`\n👤 Member: ${member.name} (@${member.username})`);
      console.log(`   Current points: ${member.points}`);
      console.log(`   bonusPoints: ${member.bonusPoints || 0}`);
      console.log(`   compensationPoints: ${member.compensationPoints || 0}`);

      // إعادة ضبط user.points إلى 0 أو قيمة موجبة
      // لأن compensationPoints الآن حقل منفصل لا يُضاف إلى user.points
      const oldPoints = member.points;

      // إذا كانت النقاط سالبة بسبب compensationPoints، نعيدها لصفر
      if (member.points < 0) {
        member.points = 0;
        await member.save();
        console.log(`   ✅ Fixed: ${oldPoints} → ${member.points}`);
      }
    }

    console.log('\n✅ All negative points fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixNegativePoints();
