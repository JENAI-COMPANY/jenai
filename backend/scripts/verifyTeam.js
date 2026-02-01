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

async function verifyTeam() {
  try {
    console.log('\n🔍 التحقق من بيانات الفريق...\n');

    // 1. الحصول على العضو الرئيسي
    const mainUser = await User.findOne({ username: 'ghgh' })
      .select('name username subscriberCode monthlyPoints generation1Points generation2Points generation3Points generation4Points generation5Points');

    console.log('📊 العضو الرئيسي:');
    console.log(`   الاسم: ${mainUser.name}`);
    console.log(`   اسم المستخدم: @${mainUser.username}`);
    console.log(`   كود الإحالة: ${mainUser.subscriberCode}`);
    console.log(`   النقاط الشهرية: ${mainUser.monthlyPoints || 0}`);
    console.log(`   الجيل 1: ${mainUser.generation1Points || 0}`);
    console.log(`   الجيل 2: ${mainUser.generation2Points || 0}`);
    console.log(`   الجيل 3: ${mainUser.generation3Points || 0}`);
    console.log(`   الجيل 4: ${mainUser.generation4Points || 0}`);
    console.log(`   الجيل 5: ${mainUser.generation5Points || 0}`);

    const totalGenPoints =
      (mainUser.generation1Points || 0) +
      (mainUser.generation2Points || 0) +
      (mainUser.generation3Points || 0) +
      (mainUser.generation4Points || 0) +
      (mainUser.generation5Points || 0);

    console.log(`   إجمالي نقاط الأجيال: ${totalGenPoints}`);
    console.log(`   إجمالي كل النقاط: ${(mainUser.monthlyPoints || 0) + totalGenPoints}`);

    // 2. جلب الأعضاء باستخدام sponsorCode (كما في teamController)
    console.log('\n' + '='.repeat(80));
    console.log('\n👥 الأعضاء المرتبطين (باستخدام sponsorCode):\n');

    const directMembers = await User.find({
      sponsorCode: mainUser.subscriberCode,
      role: 'member'
    }).select('name username subscriberCode sponsorCode monthlyPoints');

    console.log(`   عدد الأعضاء المباشرين: ${directMembers.length}\n`);

    if (directMembers.length === 0) {
      console.log('   ⚠️ لا يوجد أعضاء مرتبطين بهذا الكود!');
      console.log('   يرجى التأكد من أن sponsorCode تم ضبطه بشكل صحيح.\n');
    } else {
      for (const member of directMembers) {
        console.log(`   ✅ ${member.name} (@${member.username})`);
        console.log(`      sponsorCode: ${member.sponsorCode}`);
        console.log(`      subscriberCode: ${member.subscriberCode}`);
        console.log(`      النقاط: ${member.monthlyPoints || 0}\n`);
      }
    }

    // 3. جلب الأعضاء باستخدام referredBy (كما في البيانات الداخلية)
    console.log('='.repeat(80));
    console.log('\n👥 الأعضاء المرتبطين (باستخدام referredBy):\n');

    const directMembersByRef = await User.find({
      referredBy: mainUser._id,
      role: 'member'
    }).select('name username subscriberCode sponsorCode referredBy monthlyPoints');

    console.log(`   عدد الأعضاء المباشرين: ${directMembersByRef.length}\n`);

    for (const member of directMembersByRef) {
      console.log(`   ✅ ${member.name} (@${member.username})`);
      console.log(`      sponsorCode: ${member.sponsorCode || 'غير موجود ❌'}`);
      console.log(`      subscriberCode: ${member.subscriberCode}`);
      console.log(`      النقاط: ${member.monthlyPoints || 0}\n`);
    }

    // 4. التحقق من التطابق
    console.log('='.repeat(80));
    console.log('\n📋 التحقق من التطابق:\n');

    if (directMembers.length === directMembersByRef.length) {
      console.log(`   ✅ عدد الأعضاء متطابق: ${directMembers.length} أعضاء`);
    } else {
      console.log(`   ⚠️ عدم تطابق في عدد الأعضاء:`);
      console.log(`      باستخدام sponsorCode: ${directMembers.length}`);
      console.log(`      باستخدام referredBy: ${directMembersByRef.length}`);
    }

    // 5. التحقق من مجموع النقاط
    const totalMemberPoints = directMembersByRef.reduce((sum, m) => sum + (m.monthlyPoints || 0), 0);

    console.log(`\n   مجموع نقاط الأعضاء المباشرين: ${totalMemberPoints}`);
    console.log(`   نقاط الجيل الأول للعضو الرئيسي: ${mainUser.generation1Points || 0}`);

    if (totalMemberPoints === (mainUser.generation1Points || 0)) {
      console.log(`   ✅ النقاط متطابقة!`);
    } else {
      console.log(`   ⚠️ النقاط غير متطابقة!`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ انتهى التحقق!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

verifyTeam();
