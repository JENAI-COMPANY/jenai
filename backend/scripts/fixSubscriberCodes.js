const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

const User = require('../models/User');

async function fixSubscriberCodes() {
  try {
    console.log('\n🔧 إصلاح أكواد الأعضاء...\n');

    // 1. جلب الأعضاء الذين ليس لديهم subscriberCode
    const membersWithoutCode = await User.find({
      role: 'member',
      $or: [
        { subscriberCode: { $exists: false } },
        { subscriberCode: null },
        { subscriberCode: '' }
      ]
    });

    console.log(`📊 عدد الأعضاء بدون كود: ${membersWithoutCode.length}\n`);

    for (const member of membersWithoutCode) {
      const newCode = await User.generateSubscriberCode(
        member.country || 'فلسطين',
        member.city || 'نابلس'
      );

      member.subscriberCode = newCode;
      await member.save();

      console.log(`✅ ${member.name} (@${member.username}) - كود: ${newCode}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ تم إصلاح جميع الأكواد بنجاح!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

fixSubscriberCodes();
