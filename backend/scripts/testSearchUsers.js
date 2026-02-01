/**
 * اختبار وظيفة البحث عن المستخدمين
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  role: String,
  subscriberCode: String,
  phone: String,
  password: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function testSearchUsers() {
  try {
    console.log('\n🧪 اختبار وظيفة البحث عن المستخدمين...\n');

    // 1. Get a super admin user
    const superAdmin = await User.findOne({ role: 'super_admin' });
    if (!superAdmin) {
      console.log('❌ لا يوجد super admin في النظام');
      return;
    }
    console.log(`✅ تم العثور على Super Admin: ${superAdmin.username}\n`);

    // 2. Generate a JWT token manually for testing
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: superAdmin._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    console.log('🔑 تم إنشاء Token للاختبار\n');

    // 3. Get some test users from database
    const testUsers = await User.find({
      role: { $in: ['member', 'customer'] }
    }).limit(3).lean();

    console.log(`📋 عدد الأعضاء/الزبائن في قاعدة البيانات: ${testUsers.length}\n`);

    if (testUsers.length === 0) {
      console.log('⚠️ لا يوجد أعضاء أو زبائن للبحث عنهم');
      await mongoose.connection.close();
      return;
    }

    console.log('👥 أول 3 مستخدمين:');
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (@${user.username}) - ${user.role}`);
    });
    console.log('');

    // 4. Test the search endpoint with different queries
    const searchQueries = [
      testUsers[0]?.name?.substring(0, 2) || 'م',
      testUsers[0]?.username?.substring(0, 2) || 'user',
      testUsers[0]?.subscriberCode?.substring(0, 3) || 'PS'
    ];

    console.log('🔍 اختبار البحث...\n');

    for (const query of searchQueries) {
      if (!query) continue;

      console.log(`\n📝 البحث عن: "${query}"`);

      try {
        const response = await axios.get(
          `http://localhost:5000/api/admin/search-users?search=${encodeURIComponent(query)}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 عدد النتائج: ${response.data.users?.length || 0}`);

        if (response.data.users && response.data.users.length > 0) {
          console.log(`   👥 النتائج:`);
          response.data.users.forEach((user, index) => {
            console.log(`      ${index + 1}. ${user.name} (@${user.username}) - ${user.role}`);
          });
        } else {
          console.log(`   ⚠️ لا توجد نتائج`);
        }
      } catch (error) {
        console.log(`   ❌ فشل: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n✅ اكتمل الاختبار\n');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق اتصال قاعدة البيانات\n');
  }
}

// تشغيل السكريبت
testSearchUsers();
