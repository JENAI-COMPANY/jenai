const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jenai-network')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const User = require('../models/User');

async function checkCompensationDistribution() {
  try {
    console.log('🔍 فحص توزيع نقاط التعويض...\n');

    // الأعضاء المذكورين
    const codes = {
      'ايمان': 'PG681552',
      'رنا هنية': 'PG267267',
      'ناريمان': 'PG180010',
      'مصطفى': 'PG826155',
      'هالة عبيد': 'PH133593'
    };

    for (const [name, code] of Object.entries(codes)) {
      const user = await User.findOne({ subscriberCode: code })
        .populate('referredBy', 'name subscriberCode')
        .populate('sponsorId', 'name subscriberCode');

      if (user) {
        console.log(`\n👤 ${name} (${code}):`);
        console.log(`   - النقاط التراكمية (points): ${user.points || 0}`);
        console.log(`   - نقاط التعويض (compensationPoints): ${user.compensationPoints || 0}`);
        console.log(`   - نقاط المكافأة (bonusPoints): ${user.bonusPoints || 0}`);
        console.log(`   - النقاط الشهرية (monthlyPoints): ${user.monthlyPoints || 0}`);
        console.log(`   - الراعي (referredBy): ${user.referredBy ? `${user.referredBy.name} (${user.referredBy.subscriberCode})` : 'لا يوجد'}`);
        console.log(`   - الراعي (sponsorId): ${user.sponsorId ? `${user.sponsorId.name} (${user.sponsorId.subscriberCode})` : 'لا يوجد'}`);
      } else {
        console.log(`\n❌ ${name} (${code}): لم يتم العثور عليه`);
      }
    }

    console.log('\n\n📊 التحليل:');
    console.log('المتوقع:');
    console.log('  - هالة: 252 نقطة تعويض');
    console.log('  - مصطفى: 232 نقطة تعويض + 252 (من هالة) = 484 نقطة تراكمية');
    console.log('  - ناريمان: 252 (من هالة) + 232 (من مصطفى) = 484 نقطة تراكمية');
    console.log('  - رنا: 252 (من هالة) + 232 (من مصطفى) = 484 نقطة تراكمية');
    console.log('  - ايمان: 252 (من هالة) + 232 (من مصطفى) = 484 نقطة تراكمية');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ تم الانتهاء');
    process.exit(0);
  }
}

checkCompensationDistribution();
