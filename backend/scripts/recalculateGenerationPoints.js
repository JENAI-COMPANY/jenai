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

async function recalculateGenerationPoints() {
  try {
    console.log('\n🔄 إعادة حساب نقاط الأجيال...\n');

    // 1. الحصول على العضو ghgh
    const mainUser = await User.findOne({ username: 'ghgh' });

    if (!mainUser) {
      console.log('❌ المستخدم ghgh غير موجود');
      process.exit(1);
    }

    console.log(`📊 العضو: ${mainUser.name} (@${mainUser.username})`);
    console.log(`   ID: ${mainUser._id}`);
    console.log('\n' + '='.repeat(80));

    // 2. تصفير نقاط الأجيال الحالية
    console.log('\n🔄 تصفير نقاط الأجيال الحالية...');
    await User.updateMany(
      { role: 'member' },
      {
        $set: {
          generation1Points: 0,
          generation2Points: 0,
          generation3Points: 0,
          generation4Points: 0,
          generation5Points: 0
        }
      }
    );

    // 3. إعادة حساب نقاط الأجيال لكل عضو
    console.log('\n📊 إعادة حساب نقاط الأجيال...\n');

    const allMembers = await User.find({ role: 'member' })
      .select('_id name username monthlyPoints referredBy');

    let processedCount = 0;

    for (const member of allMembers) {
      const memberPoints = member.monthlyPoints || 0;

      if (memberPoints === 0) continue;

      console.log(`\n   🔸 ${member.name} (@${member.username}) - ${memberPoints} نقطة`);

      // توزيع نقاط العضو على الأجيال الخمسة فوقه
      let currentMemberId = member.referredBy;
      let generationLevel = 1;

      while (currentMemberId && generationLevel <= 5) {
        const sponsor = await User.findById(currentMemberId);

        if (!sponsor || sponsor.role !== 'member') break;

        const fieldName = `generation${generationLevel}Points`;

        // إضافة نقاط العضو إلى الجيل المناسب للراعي
        await User.findByIdAndUpdate(sponsor._id, {
          $inc: { [fieldName]: memberPoints }
        });

        console.log(`      ➜ الجيل ${generationLevel}: ${sponsor.name} (@${sponsor.username}) +${memberPoints} نقطة`);

        currentMemberId = sponsor.referredBy;
        generationLevel++;
      }

      processedCount++;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ تم معالجة ${processedCount} عضو لديهم نقاط`);

    // 4. عرض النقاط الجديدة للعضو ghgh
    const updatedUser = await User.findOne({ username: 'ghgh' })
      .select('name username monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points');

    console.log('\n📊 النقاط النهائية للعضو ghgh:');
    console.log(`   النقاط الشهرية: ${updatedUser.monthlyPoints || 0}`);
    console.log(`   نقاط الجيل 1: ${updatedUser.generation1Points || 0}`);
    console.log(`   نقاط الجيل 2: ${updatedUser.generation2Points || 0}`);
    console.log(`   نقاط الجيل 3: ${updatedUser.generation3Points || 0}`);
    console.log(`   نقاط الجيل 4: ${updatedUser.generation4Points || 0}`);
    console.log(`   نقاط الجيل 5: ${updatedUser.generation5Points || 0}`);

    // 5. عرض الأعضاء المباشرين (الجيل الأول)
    console.log('\n👥 الأعضاء المباشرين (الجيل الأول):');
    const directMembers = await User.find({
      referredBy: mainUser._id,
      role: 'member'
    }).select('name username monthlyPoints');

    if (directMembers.length === 0) {
      console.log('   ⚠️ لا يوجد أعضاء مباشرين');
    } else {
      directMembers.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name} (@${m.username}) - ${m.monthlyPoints || 0} نقطة`);
      });
    }

    console.log('\n✅ تم إعادة حساب نقاط الأجيال بنجاح!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

recalculateGenerationPoints();
