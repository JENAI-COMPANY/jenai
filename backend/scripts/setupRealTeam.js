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

async function setupRealTeam() {
  try {
    console.log('\n🏗️ إنشاء فريق حقيقي للعضو ghgh...\n');

    // 1. الحصول على العضو ghgh
    const mainUser = await User.findOne({ username: 'ghgh' });

    if (!mainUser) {
      console.log('❌ المستخدم ghgh غير موجود');
      process.exit(1);
    }

    console.log(`📊 العضو الرئيسي: ${mainUser.name} (@${mainUser.username})`);
    console.log(`   ID: ${mainUser._id}`);
    console.log(`   كود الإحالة: ${mainUser.subscriberCode}\n`);

    // 2. تصفير كل النقاط أولاً
    console.log('🔄 تصفير جميع النقاط...');
    await User.updateMany(
      { role: 'member' },
      {
        $set: {
          monthlyPoints: 0,
          generation1Points: 0,
          generation2Points: 0,
          generation3Points: 0,
          generation4Points: 0,
          generation5Points: 0
        }
      }
    );

    // 3. إنشاء/تحديث الأعضاء الثلاثة (أحمد، سارة، محمود)
    const teamMembers = [
      { username: 'ahmed_test1', name: 'أحمد محمد', points: 163 },
      { username: 'sara_test1', name: 'سارة علي', points: 334 },
      { username: 'mahmoud_test1', name: 'محمود حسن', points: 437 }
    ];

    console.log('\n👥 إنشاء/تحديث أعضاء الفريق:\n');

    for (const memberData of teamMembers) {
      let member = await User.findOne({ username: memberData.username });

      if (member) {
        // تحديث العضو الموجود
        member.referredBy = mainUser._id;
        member.sponsorId = mainUser._id;
        member.sponsorCode = mainUser.subscriberCode;
        member.monthlyPoints = memberData.points;
        member.points = memberData.points;
        await member.save();

        console.log(`   ✅ تم تحديث: ${memberData.name} (@${memberData.username}) - ${memberData.points} نقطة`);
      } else {
        // إنشاء عضو جديد
        member = new User({
          username: memberData.username,
          name: memberData.name,
          password: '123456',
          role: 'member',
          referredBy: mainUser._id,
          sponsorId: mainUser._id,
          sponsorCode: mainUser.subscriberCode,
          monthlyPoints: memberData.points,
          points: memberData.points,
          memberRank: 'agent',
          country: 'فلسطين',
          city: 'نابلس'
        });
        await member.save();

        console.log(`   ✅ تم إنشاء: ${memberData.name} (@${memberData.username}) - ${memberData.points} نقطة`);
      }

      // إضافة العضو إلى downline للعضو الرئيسي
      if (!mainUser.downline.includes(member._id)) {
        mainUser.downline.push(member._id);
      }
    }

    await mainUser.save();

    // 4. إعادة حساب نقاط الأجيال
    console.log('\n📊 إعادة حساب نقاط الأجيال...\n');

    const allMembers = await User.find({ role: 'member' })
      .select('_id name username monthlyPoints referredBy');

    for (const member of allMembers) {
      const memberPoints = member.monthlyPoints || 0;

      if (memberPoints === 0) continue;

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

        console.log(`   ${member.name} ➜ الجيل ${generationLevel} لـ ${sponsor.name}: +${memberPoints} نقطة`);

        currentMemberId = sponsor.referredBy;
        generationLevel++;
      }
    }

    // 5. تعيين نقاط شهرية للعضو الرئيسي ghgh
    console.log('\n📊 تعيين نقاط شهرية للعضو ghgh...');
    await User.findByIdAndUpdate(mainUser._id, {
      $set: {
        monthlyPoints: 500,
        points: 500
      }
    });

    // 6. عرض النتيجة النهائية
    const updatedUser = await User.findOne({ username: 'ghgh' })
      .select('name username monthlyPoints points generation1Points generation2Points generation3Points generation4Points generation5Points');

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ النقاط النهائية للعضو ghgh:\n');
    console.log(`   النقاط الشهرية: ${updatedUser.monthlyPoints || 0}`);
    console.log(`   إجمالي النقاط: ${updatedUser.points || 0}`);
    console.log(`   نقاط الجيل الأول: ${updatedUser.generation1Points || 0}`);
    console.log(`   نقاط الجيل الثاني: ${updatedUser.generation2Points || 0}`);
    console.log(`   نقاط الجيل الثالث: ${updatedUser.generation3Points || 0}`);
    console.log(`   نقاط الجيل الرابع: ${updatedUser.generation4Points || 0}`);
    console.log(`   نقاط الجيل الخامس: ${updatedUser.generation5Points || 0}`);

    // 7. عرض الأعضاء المباشرين
    console.log('\n👥 الأعضاء المباشرين (الجيل الأول):\n');
    const directMembers = await User.find({
      referredBy: mainUser._id,
      role: 'member'
    }).select('name username monthlyPoints');

    directMembers.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name} (@${m.username}) - ${m.monthlyPoints || 0} نقطة`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ تم إنشاء الفريق الحقيقي بنجاح!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

setupRealTeam();
