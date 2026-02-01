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

async function cleanAndSetupTeam() {
  try {
    console.log('\n🧹 تنظيف وإعادة إنشاء الفريق...\n');

    // 1. الحصول على العضو الرئيسي ghgh
    const mainUser = await User.findOne({ username: 'ghgh' });

    if (!mainUser) {
      console.log('❌ المستخدم ghgh غير موجود');
      process.exit(1);
    }

    console.log(`📊 العضو الرئيسي: ${mainUser.name} (@${mainUser.username})`);
    console.log(`   كود الإحالة: ${mainUser.subscriberCode}\n`);

    // 2. جلب جميع الأعضاء المرتبطين حالياً
    const existingMembers = await User.find({
      role: 'member',
      _id: { $ne: mainUser._id }
    }).select('username name sponsorCode referredBy');

    console.log(`📊 الأعضاء الموجودين حالياً: ${existingMembers.length}\n`);

    // 3. حذف جميع الأعضاء الاختباريين القدامى (ما عدا الأعضاء الجدد)
    const membersToKeep = [
      'ahmed_test1',
      'sara_test1',
      'mahmoud_test1',
      'ali_test2',
      'fatima_test3',
      'omar_test4',
      'laila_test5'
    ];

    const membersToDelete = existingMembers.filter(m => !membersToKeep.includes(m.username));

    console.log(`🗑️ حذف الأعضاء القدامى (${membersToDelete.length})...\n`);

    for (const member of membersToDelete) {
      console.log(`   ❌ حذف: ${member.name} (@${member.username})`);
      await User.findByIdAndDelete(member._id);
    }

    // 4. تصفير جميع النقاط
    console.log('\n🔄 تصفير جميع النقاط...');
    await User.updateMany(
      { role: 'member' },
      {
        $set: {
          monthlyPoints: 0,
          points: 0,
          generation1Points: 0,
          generation2Points: 0,
          generation3Points: 0,
          generation4Points: 0,
          generation5Points: 0
        }
      }
    );

    // 5. إعادة إنشاء/تحديث الفريق الحقيقي
    console.log('\n👥 إنشاء الفريق الحقيقي...\n');

    // الجيل الأول
    const gen1Data = [
      { username: 'ahmed_test1', name: 'أحمد محمد', points: 163, sponsor: mainUser },
      { username: 'sara_test1', name: 'سارة علي', points: 334, sponsor: mainUser },
      { username: 'mahmoud_test1', name: 'محمود حسن', points: 437, sponsor: mainUser }
    ];

    for (const data of gen1Data) {
      await createOrUpdateMember(data);
    }

    // الجيل الثاني
    const ahmed = await User.findOne({ username: 'ahmed_test1' });
    const ali = await createOrUpdateMember({
      username: 'ali_test2',
      name: 'علي أحمد',
      points: 200,
      sponsor: ahmed
    });

    // الجيل الثالث
    const fatima = await createOrUpdateMember({
      username: 'fatima_test3',
      name: 'فاطمة علي',
      points: 150,
      sponsor: ali
    });

    // الجيل الرابع
    const omar = await createOrUpdateMember({
      username: 'omar_test4',
      name: 'عمر فاطمة',
      points: 50,
      sponsor: fatima
    });

    // الجيل الخامس
    await createOrUpdateMember({
      username: 'laila_test5',
      name: 'ليلى عمر',
      points: 34,
      sponsor: omar
    });

    // 6. إعادة حساب نقاط الأجيال
    console.log('\n📊 إعادة حساب نقاط الأجيال...');
    await recalculateAllGenerationPoints();

    // 7. تعيين نقاط للعضو الرئيسي
    await User.findByIdAndUpdate(mainUser._id, {
      $set: {
        monthlyPoints: 500,
        points: 500
      }
    });

    // 8. عرض النتيجة النهائية
    const updatedUser = await User.findOne({ username: 'ghgh' })
      .select('name username monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points');

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ النقاط النهائية للعضو ghgh:\n');
    console.log(`   النقاط الشهرية: ${updatedUser.monthlyPoints || 0}`);
    console.log(`   نقاط الجيل الأول: ${updatedUser.generation1Points || 0}`);
    console.log(`   نقاط الجيل الثاني: ${updatedUser.generation2Points || 0}`);
    console.log(`   نقاط الجيل الثالث: ${updatedUser.generation3Points || 0}`);
    console.log(`   نقاط الجيل الرابع: ${updatedUser.generation4Points || 0}`);
    console.log(`   نقاط الجيل الخامس: ${updatedUser.generation5Points || 0}`);

    const totalGenPoints =
      (updatedUser.generation1Points || 0) +
      (updatedUser.generation2Points || 0) +
      (updatedUser.generation3Points || 0) +
      (updatedUser.generation4Points || 0) +
      (updatedUser.generation5Points || 0);

    console.log(`\n   إجمالي نقاط الأجيال: ${totalGenPoints}`);
    console.log(`   إجمالي كل النقاط: ${(updatedUser.monthlyPoints || 0) + totalGenPoints}`);

    // 9. عرض الأعضاء النهائيين
    const finalMembers = await User.find({
      role: 'member',
      _id: { $ne: mainUser._id }
    }).select('name username monthlyPoints sponsorCode');

    console.log('\n' + '='.repeat(80));
    console.log(`\n👥 إجمالي الأعضاء النهائيين: ${finalMembers.length}\n`);

    for (const member of finalMembers) {
      console.log(`   ${member.name} (@${member.username}) - ${member.monthlyPoints || 0} نقطة`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ تم تنظيف وإعادة إنشاء الفريق بنجاح!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

// دالة مساعدة لإنشاء أو تحديث عضو
async function createOrUpdateMember({ username, name, points, sponsor }) {
  let member = await User.findOne({ username });

  if (member) {
    member.referredBy = sponsor._id;
    member.sponsorId = sponsor._id;
    member.sponsorCode = sponsor.subscriberCode;
    member.monthlyPoints = points;
    member.points = points;

    // توليد subscriberCode إذا لم يكن موجوداً
    if (!member.subscriberCode) {
      member.subscriberCode = await User.generateSubscriberCode(
        member.country || 'فلسطين',
        member.city || 'نابلس'
      );
    }

    await member.save();
    console.log(`   ✅ تحديث: ${name} - ${points} نقطة`);
  } else {
    const newSubscriberCode = await User.generateSubscriberCode('فلسطين', 'نابلس');

    member = new User({
      username,
      name,
      password: '123456',
      role: 'member',
      referredBy: sponsor._id,
      sponsorId: sponsor._id,
      sponsorCode: sponsor.subscriberCode,
      subscriberCode: newSubscriberCode,
      monthlyPoints: points,
      points: points,
      memberRank: 'agent',
      country: 'فلسطين',
      city: 'نابلس'
    });
    await member.save();
    console.log(`   ✅ إنشاء: ${name} - ${points} نقطة`);
  }

  // إضافة العضو إلى downline للراعي
  if (!sponsor.downline.includes(member._id)) {
    sponsor.downline.push(member._id);
    await sponsor.save();
  }

  return member;
}

// دالة إعادة حساب نقاط الأجيال لجميع الأعضاء
async function recalculateAllGenerationPoints() {
  // تصفير نقاط الأجيال
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

  // إعادة الحساب
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

      await User.findByIdAndUpdate(sponsor._id, {
        $inc: { [fieldName]: memberPoints }
      });

      currentMemberId = sponsor.referredBy;
      generationLevel++;
    }
  }
}

cleanAndSetupTeam();
