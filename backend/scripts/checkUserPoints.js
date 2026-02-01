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

async function checkUserPoints() {
  try {
    console.log('\n🔍 فحص نقاط المستخدمين...\n');

    // Get user that is logged in (ghgh)
    const user = await User.findOne({ username: 'ghgh' })
      .select('name username role points monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points');

    if (!user) {
      console.log('❌ المستخدم ghgh غير موجود');
      process.exit(1);
    }

    console.log('📊 بيانات المستخدم:');
    console.log(`   الاسم: ${user.name}`);
    console.log(`   اسم المستخدم: ${user.username}`);
    console.log(`   الدور: ${user.role}`);
    console.log(`   إجمالي النقاط: ${user.points || 0}`);
    console.log(`   النقاط الشهرية: ${user.monthlyPoints || 0}`);
    console.log(`   نقاط الجيل 1: ${user.generation1Points || 0}`);
    console.log(`   نقاط الجيل 2: ${user.generation2Points || 0}`);
    console.log(`   نقاط الجيل 3: ${user.generation3Points || 0}`);
    console.log(`   نقاط الجيل 4: ${user.generation4Points || 0}`);
    console.log(`   نقاط الجيل 5: ${user.generation5Points || 0}`);

    // Check test users
    console.log('\n\n📊 فحص المستخدمين الاختباريين:');
    const testUsers = await User.find({
      username: { $regex: /_test1$/ }
    })
      .select('name username points monthlyPoints generation1Points generation2Points')
      .limit(5);

    testUsers.forEach(u => {
      console.log(`\n   ${u.name} (@${u.username})`);
      console.log(`      النقاط: ${u.points || 0}`);
      console.log(`      النقاط الشهرية: ${u.monthlyPoints || 0}`);
      console.log(`      نقاط الجيل 1: ${u.generation1Points || 0}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

checkUserPoints();
