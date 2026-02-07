const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

/**
 * تنظيف نقاط الترحيب المنتهية
 *
 * هذا الـ script يفحص جميع الأعضاء الذين:
 * 1. لم يحصلوا على نقاط الترحيب بعد (received = false)
 * 2. انتهى تاريخ صلاحية النقاط (expiresAt < now)
 *
 * ويقوم بتحديث حالتهم لإلغاء الفرصة
 */
async function cleanupExpiredBonuses() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const now = new Date();

    // البحث عن الأعضاء الذين لم يحصلوا على النقاط وانتهى وقتهم
    const expiredMembers = await User.find({
      role: 'member',
      'firstOrderBonus.received': false,
      'firstOrderBonus.expiresAt': { $lt: now }
    });

    console.log(`📊 Found ${expiredMembers.length} members with expired welcome bonuses`);

    if (expiredMembers.length > 0) {
      // تحديث السجلات لتعيين النقاط إلى 0 (اختياري - فقط للتوضيح)
      const result = await User.updateMany(
        {
          role: 'member',
          'firstOrderBonus.received': false,
          'firstOrderBonus.expiresAt': { $lt: now }
        },
        {
          $set: {
            'firstOrderBonus.points': 0
          }
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} expired bonuses`);

      // طباعة أسماء الأعضاء الذين فاتتهم الفرصة
      expiredMembers.forEach(member => {
        console.log(`   ⏰ ${member.name} (${member.subscriberCode}) - فاتته فرصة نقاط الترحيب`);
      });
    } else {
      console.log('✨ No expired bonuses found');
    }

    await mongoose.connection.close();
    console.log('✅ Cleanup completed successfully');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// تشغيل الـ script
if (require.main === module) {
  cleanupExpiredBonuses();
}

module.exports = cleanupExpiredBonuses;
