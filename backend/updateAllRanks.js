const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const { updateAllMembersRanks } = require('./config/memberRanks');

const updateAllRanksScript = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://104.218.48.119:27017/jenai_db');
    console.log('✅ متصل بقاعدة البيانات');

    console.log('🔄 جاري تحديث جميع رتب الأعضاء...');

    // تحديث جميع الرتب بناءً على النقاط التراكمية الحالية
    const result = await updateAllMembersRanks(User);

    console.log('\n📊 نتيجة التحديث:');
    console.log(`   - إجمالي الأعضاء المفحوصين: ${result.totalMembers}`);
    console.log(`   - الرتب المحدثة: ${result.updated}`);
    console.log(`   - الرتب بدون تغيير: ${result.unchanged}`);

    if (result.updates && result.updates.length > 0) {
      console.log('\n📝 التفاصيل:');
      result.updates.forEach((update, index) => {
        console.log(`   ${index + 1}. ${update.name} (${update.username})`);
        console.log(`      - النقاط التراكمية: ${update.cumulativePoints}`);
        console.log(`      - الخطوط البرونزية: ${update.bronzeLines}`);
        console.log(`      - الرتبة: ${update.oldRank} → ${update.newRank} (رقم ${update.newRankNumber})`);
      });
    }

    console.log('\n✅ تم تحديث جميع الرتب بنجاح');

    await mongoose.connection.close();
    console.log('✅ تم إغلاق الاتصال');
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
};

updateAllRanksScript();
