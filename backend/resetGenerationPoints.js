const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const resetGenerationPoints = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://104.218.48.119:27017/jenai_db');
    console.log('✅ متصل بقاعدة البيانات');

    // تصفير نقاط الأجيال لجميع الأعضاء
    const result = await User.updateMany(
      { role: 'member' },
      {
        $set: {
          generation1Points: 0,
          generation2Points: 0,
          generation3Points: 0,
          generation4Points: 0,
          generation5Points: 0,
          leadershipPoints: 0
        }
      }
    );

    console.log(`✅ تم تصفير نقاط الأجيال لـ ${result.modifiedCount} عضو`);

    await mongoose.connection.close();
    console.log('✅ تم إغلاق الاتصال');
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
};

resetGenerationPoints();
