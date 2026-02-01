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

async function addPointsToUser() {
  try {
    console.log('\n📝 إضافة نقاط للمستخدم ghgh...\n');

    // Update ghgh user with points
    const result = await User.findOneAndUpdate(
      { username: 'ghgh' },
      {
        $set: {
          points: 1234,
          monthlyPoints: 500,
          generation1Points: 300,
          generation2Points: 200,
          generation3Points: 150,
          generation4Points: 50,
          generation5Points: 34
        }
      },
      { new: true }
    );

    if (!result) {
      console.log('❌ المستخدم ghgh غير موجود');
      process.exit(1);
    }

    console.log('✅ تم تحديث النقاط بنجاح:');
    console.log(`   إجمالي النقاط: ${result.points}`);
    console.log(`   النقاط الشهرية: ${result.monthlyPoints}`);
    console.log(`   نقاط الجيل 1: ${result.generation1Points}`);
    console.log(`   نقاط الجيل 2: ${result.generation2Points}`);
    console.log(`   نقاط الجيل 3: ${result.generation3Points}`);
    console.log(`   نقاط الجيل 4: ${result.generation4Points}`);
    console.log(`   نقاط الجيل 5: ${result.generation5Points}`);

    console.log('\n✅ يمكنك الآن تحديث صفحة أرباحي لرؤية النقاط!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

addPointsToUser();
