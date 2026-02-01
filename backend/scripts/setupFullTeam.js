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

async function setupFullTeam() {
  try {
    console.log('\n🏗️ إنشاء فريق كامل (5 أجيال) للعضو ghgh...\n');

    // 1. الحصول على العضو ghgh
    const mainUser = await User.findOne({ username: 'ghgh' });

    if (!mainUser) {
      console.log('❌ المستخدم ghgh غير موجود');
      process.exit(1);
    }

    console.log(`📊 العضو الرئيسي: ${mainUser.name} (@${mainUser.username})\n`);

    // 2. الحصول على الأعضاء المباشرين (الجيل الأول)
    const gen1Members = await User.find({
      referredBy: mainUser._id,
      role: 'member'
    });

    console.log(`✅ الجيل الأول: ${gen1Members.length} أعضاء`);

    if (gen1Members.length === 0) {
      console.log('❌ لا يوجد أعضاء في الجيل الأول. قم بتشغيل setupRealTeam.js أولاً');
      process.exit(1);
    }

    // 3. إنشاء أعضاء الجيل الثاني (تحت أحمد)
    console.log('\n🔹 إنشاء الجيل الثاني تحت أحمد محمد...');

    const ahmed = await User.findOne({ username: 'ahmed_test1' });

    if (ahmed) {
      const gen2Member = await createOrUpdateMember({
        username: 'ali_test2',
        name: 'علي أحمد',
        points: 200,
        sponsor: ahmed,
        mainUser
      });
      console.log(`   ✅ ${gen2Member.name} - ${gen2Member.monthlyPoints} نقطة`);

      // 4. إنشاء أعضاء الجيل الثالث (تحت علي)
      console.log('\n🔹 إنشاء الجيل الثالث تحت علي أحمد...');

      const gen3Member = await createOrUpdateMember({
        username: 'fatima_test3',
        name: 'فاطمة علي',
        points: 150,
        sponsor: gen2Member,
        mainUser
      });
      console.log(`   ✅ ${gen3Member.name} - ${gen3Member.monthlyPoints} نقطة`);

      // 5. إنشاء أعضاء الجيل الرابع (تحت فاطمة)
      console.log('\n🔹 إنشاء الجيل الرابع تحت فاطمة علي...');

      const gen4Member = await createOrUpdateMember({
        username: 'omar_test4',
        name: 'عمر فاطمة',
        points: 50,
        sponsor: gen3Member,
        mainUser
      });
      console.log(`   ✅ ${gen4Member.name} - ${gen4Member.monthlyPoints} نقطة`);

      // 6. إنشاء أعضاء الجيل الخامس (تحت عمر)
      console.log('\n🔹 إنشاء الجيل الخامس تحت عمر فاطمة...');

      const gen5Member = await createOrUpdateMember({
        username: 'laila_test5',
        name: 'ليلى عمر',
        points: 34,
        sponsor: gen4Member,
        mainUser
      });
      console.log(`   ✅ ${gen5Member.name} - ${gen5Member.monthlyPoints} نقطة`);
    }

    // 7. إعادة حساب نقاط الأجيال
    console.log('\n📊 إعادة حساب نقاط الأجيال...');
    await recalculateAllGenerationPoints();

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
    console.log(`   إجمالي نقاط الفريق: ${1234} (${updatedUser.monthlyPoints} + ${totalGenPoints})`);

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ تم إنشاء الفريق الكامل (5 أجيال) بنجاح!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

// دالة مساعدة لإنشاء أو تحديث عضو
async function createOrUpdateMember({ username, name, points, sponsor, mainUser }) {
  let member = await User.findOne({ username });

  if (member) {
    member.referredBy = sponsor._id;
    member.sponsorId = sponsor._id;
    member.sponsorCode = sponsor.subscriberCode;
    member.monthlyPoints = points;
    member.points = points;
    await member.save();
  } else {
    member = new User({
      username,
      name,
      password: '123456',
      role: 'member',
      referredBy: sponsor._id,
      sponsorId: sponsor._id,
      sponsorCode: sponsor.subscriberCode,
      monthlyPoints: points,
      points: points,
      memberRank: 'agent',
      country: 'فلسطين',
      city: 'نابلس'
    });
    await member.save();
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

setupFullTeam();
