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
const bcrypt = require('bcryptjs');

async function createTestTeam() {
  try {
    const sponsorCode = 'LD103474';

    console.log(`\n🔍 البحث عن صاحب كود الإحالة: ${sponsorCode}...`);

    // Find the sponsor
    const sponsor = await User.findOne({ subscriberCode: sponsorCode });

    if (!sponsor) {
      console.log('❌ كود الإحالة غير موجود في قاعدة البيانات');
      console.log('\n📋 الأكواد المتاحة:');
      const usersWithCodes = await User.find({ subscriberCode: { $exists: true, $ne: null } })
        .select('name username subscriberCode role');
      usersWithCodes.forEach(u => {
        console.log(`   - ${u.name} (@${u.username}): ${u.subscriberCode} [${u.role}]`);
      });
      process.exit(1);
    }

    console.log(`✅ تم العثور على: ${sponsor.name} (@${sponsor.username})`);
    console.log(`   الدور: ${sponsor.role}`);
    console.log(`   الكود: ${sponsor.subscriberCode}\n`);

    // Define test users for 5 levels
    const testUsers = [
      // Level 1 - Direct referrals
      { name: 'أحمد محمد', username: 'ahmed_test1', sponsorCode: sponsorCode, level: 1 },
      { name: 'سارة علي', username: 'sara_test1', sponsorCode: sponsorCode, level: 1 },
      { name: 'محمود حسن', username: 'mahmoud_test1', sponsorCode: sponsorCode, level: 1 },

      // Level 2
      { name: 'فاطمة خالد', username: 'fatima_test2', sponsorCode: null, level: 2, parentIndex: 0 },
      { name: 'علي أحمد', username: 'ali_test2', sponsorCode: null, level: 2, parentIndex: 0 },
      { name: 'نور الدين', username: 'nour_test2', sponsorCode: null, level: 2, parentIndex: 1 },
      { name: 'ليلى سعيد', username: 'layla_test2', sponsorCode: null, level: 2, parentIndex: 2 },

      // Level 3
      { name: 'خالد يوسف', username: 'khaled_test3', sponsorCode: null, level: 3, parentIndex: 3 },
      { name: 'منى عبدالله', username: 'mona_test3', sponsorCode: null, level: 3, parentIndex: 3 },
      { name: 'عمر فاروق', username: 'omar_test3', sponsorCode: null, level: 3, parentIndex: 4 },
      { name: 'هدى محمود', username: 'huda_test3', sponsorCode: null, level: 3, parentIndex: 5 },
      { name: 'ياسر إبراهيم', username: 'yasser_test3', sponsorCode: null, level: 3, parentIndex: 6 },

      // Level 4
      { name: 'ريم حسام', username: 'reem_test4', sponsorCode: null, level: 4, parentIndex: 7 },
      { name: 'طارق عادل', username: 'tarek_test4', sponsorCode: null, level: 4, parentIndex: 8 },
      { name: 'دينا سمير', username: 'dina_test4', sponsorCode: null, level: 4, parentIndex: 9 },
      { name: 'وليد ماجد', username: 'walid_test4', sponsorCode: null, level: 4, parentIndex: 10 },
      { name: 'سلمى نبيل', username: 'salma_test4', sponsorCode: null, level: 4, parentIndex: 11 },

      // Level 5
      { name: 'حسام الدين', username: 'hussam_test5', sponsorCode: null, level: 5, parentIndex: 12 },
      { name: 'رنا عماد', username: 'rana_test5', sponsorCode: null, level: 5, parentIndex: 13 },
      { name: 'بلال فهد', username: 'bilal_test5', sponsorCode: null, level: 5, parentIndex: 14 },
      { name: 'لينا زياد', username: 'lina_test5', sponsorCode: null, level: 5, parentIndex: 15 },
      { name: 'كريم رامي', username: 'karim_test5', sponsorCode: null, level: 5, parentIndex: 16 }
    ];

    const createdUsers = [];
    const hashedPassword = await bcrypt.hash('test123', 10);

    console.log('🚀 بدء إنشاء المستخدمين الاختباريين...\n');

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ username: userData.username });
        if (existingUser) {
          console.log(`⚠️  المستخدم ${userData.username} موجود بالفعل - تخطي`);
          createdUsers.push(existingUser);
          continue;
        }

        // Determine sponsor code
        let userSponsorCode = userData.sponsorCode;
        if (!userSponsorCode && userData.parentIndex !== undefined) {
          userSponsorCode = createdUsers[userData.parentIndex]?.subscriberCode;
        }

        // Generate random points between 100-500
        const points = Math.floor(Math.random() * 400) + 100;

        // Select random city
        const city = ['غزة', 'رام الله', 'الخليل', 'نابلس', 'جنين'][Math.floor(Math.random() * 5)];
        const country = 'فلسطين';

        // Create user instance
        const newUser = new User({
          name: userData.name,
          username: userData.username,
          password: hashedPassword,
          phone: `0599${Math.floor(Math.random() * 900000) + 100000}`,
          role: 'member',
          country: country,
          city: city,
          sponsorCode: userSponsorCode,
          points: points
        });

        // Generate subscriberCode explicitly (not automatic in pre-save)
        newUser.subscriberCode = await User.generateSubscriberCode(country, city);

        // Save user
        await newUser.save();

        createdUsers.push(newUser);

        console.log(`✅ المستوى ${userData.level} - تم إنشاء: ${newUser.name}`);
        console.log(`   اسم المستخدم: ${newUser.username}`);
        console.log(`   كود العضو: ${newUser.subscriberCode}`);
        console.log(`   كود الراعي: ${userSponsorCode || 'لا يوجد'}`);
        console.log(`   النقاط: ${points}`);
        console.log('');

      } catch (error) {
        console.error(`❌ فشل إنشاء ${userData.username}:`, error.message);
      }
    }

    console.log('='.repeat(80));
    console.log(`\n✅ تم إنشاء ${createdUsers.length} مستخدم بنجاح!\n`);

    // Display hierarchy
    console.log('📊 هيكل الفريق:');
    console.log('='.repeat(80));

    const level1 = createdUsers.filter((u, i) => testUsers[i].level === 1);
    const level2 = createdUsers.filter((u, i) => testUsers[i].level === 2);
    const level3 = createdUsers.filter((u, i) => testUsers[i].level === 3);
    const level4 = createdUsers.filter((u, i) => testUsers[i].level === 4);
    const level5 = createdUsers.filter((u, i) => testUsers[i].level === 5);

    console.log(`\n🌟 ${sponsor.name} (${sponsor.subscriberCode})`);
    console.log(`└─ المستوى 1: ${level1.length} أعضاء`);
    level1.forEach(u => console.log(`   ├─ ${u.name} (${u.subscriberCode}) - ${u.points} نقطة`));
    console.log(`└─ المستوى 2: ${level2.length} أعضاء`);
    level2.forEach(u => console.log(`   ├─ ${u.name} (${u.subscriberCode}) - ${u.points} نقطة`));
    console.log(`└─ المستوى 3: ${level3.length} أعضاء`);
    level3.forEach(u => console.log(`   ├─ ${u.name} (${u.subscriberCode}) - ${u.points} نقطة`));
    console.log(`└─ المستوى 4: ${level4.length} أعضاء`);
    level4.forEach(u => console.log(`   ├─ ${u.name} (${u.subscriberCode}) - ${u.points} نقطة`));
    console.log(`└─ المستوى 5: ${level5.length} أعضاء`);
    level5.forEach(u => console.log(`   └─ ${u.name} (${u.subscriberCode}) - ${u.points} نقطة`));

    console.log('\n' + '='.repeat(80));
    console.log('📝 ملاحظات:');
    console.log('- كلمة المرور لجميع المستخدمين: test123');
    console.log('- يمكنك الآن تسجيل الدخول بأي حساب واستخدام كود الإحالة الخاص به');
    console.log('- للاختبار، سجل دخول بحساب صاحب كود الإحالة الأصلي واذهب إلى تبويب "فريقي"');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

createTestTeam();
