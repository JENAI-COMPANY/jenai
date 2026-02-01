const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

const User = require('../models/User');

async function listUsers() {
  try {
    const users = await User.find()
      .select('username name role email subscriberCode')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log('\n📋 قائمة المستخدمين الأخيرة (آخر 20 مستخدم):');
    console.log('='.repeat(80));

    if (users.length === 0) {
      console.log('❌ لا يوجد مستخدمين في قاعدة البيانات');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. اسم المستخدم: ${user.username}`);
        console.log(`   الاسم: ${user.name}`);
        console.log(`   الدور: ${user.role}`);
        console.log(`   البريد: ${user.email || 'غير محدد'}`);
        console.log(`   كود العضو: ${user.subscriberCode || 'غير محدد'}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ إجمالي المستخدمين: ${await User.countDocuments()}`);

    // Search for specific username
    console.log('\n🔍 البحث عن المستخدم "hghg"...');
    const specificUser = await User.findOne({ username: 'hghg' });

    if (specificUser) {
      console.log('✅ المستخدم موجود:');
      console.log(`   - الاسم: ${specificUser.name}`);
      console.log(`   - الدور: ${specificUser.role}`);
      console.log(`   - البريد: ${specificUser.email || 'غير محدد'}`);
      console.log(`   - كود العضو: ${specificUser.subscriberCode || 'غير محدد'}`);
      console.log(`   - الحساب نشط: ${specificUser.isActive !== false ? 'نعم' : 'لا'}`);
    } else {
      console.log('❌ المستخدم "hghg" غير موجود في قاعدة البيانات');
      console.log('\n💡 تلميح: تأكد من كتابة اسم المستخدم بشكل صحيح (حساس لحالة الأحرف)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

listUsers();
