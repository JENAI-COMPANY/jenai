/**
 * إعادة حساب أرباح القيادة لجميع الأعضاء بعد الإصلاح
 * يقوم بتحديث نقاط وعمولات القيادة في قاعدة البيانات
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const { updateMemberLeadershipCommission } = require('./utils/calculateLeadershipCommission');
require('dotenv').config();

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jenai')
  .then(() => console.log('✅ متصل بقاعدة البيانات'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

async function recalculateAllLeadershipCommissions() {
  try {
    console.log('\n🔄 ══════════════════════════════════════════════════');
    console.log('   إعادة حساب أرباح القيادة لجميع الأعضاء');
    console.log('══════════════════════════════════════════════════\n');

    // جلب جميع الأعضاء الذين لديهم رتبة غير وكيل
    const members = await User.find({
      role: 'member',
      memberRank: { $ne: 'agent' }
    }).select('name username memberRank leadershipPoints totalCommission').sort({ createdAt: 1 });

    console.log(`📊 عدد الأعضاء المؤهلين: ${members.length}\n`);

    if (members.length === 0) {
      console.log('⚠️  لا يوجد أعضاء مؤهلين لأرباح القيادة\n');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let totalCommissionChange = 0;

    // إعادة حساب عمولة القيادة لكل عضو
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      console.log(`\n[${i + 1}/${members.length}] 👤 ${member.name} (@${member.username}) - ${member.memberRank}`);
      console.log(`   النقاط القديمة: ${(member.leadershipPoints || 0).toFixed(2)}`);

      try {
        const result = await updateMemberLeadershipCommission(member._id);

        if (result) {
          successCount++;
          totalCommissionChange += result.commissionDiff;

          if (Math.abs(result.commissionDiff) > 0) {
            console.log(`   ✅ تم التحديث: ${result.oldPoints.toFixed(2)} → ${result.newPoints.toFixed(2)} نقطة`);
            console.log(`   💰 التغيير في العمولة: ${result.commissionDiff > 0 ? '+' : ''}${result.commissionDiff} شيكل`);
          } else {
            console.log(`   ✓ لم يتغير (الحساب صحيح)`);
          }
        } else {
          console.log(`   ⚠️  لم يتم التحديث`);
          errorCount++;
        }
      } catch (error) {
        console.error(`   ❌ خطأ: ${error.message}`);
        errorCount++;
      }
    }

    // ملخص النتائج
    console.log(`\n${'═'.repeat(60)}`);
    console.log('📊 ملخص النتائج:');
    console.log(`${'─'.repeat(60)}`);
    console.log(`   ✅ نجح: ${successCount} عضو`);
    console.log(`   ❌ فشل: ${errorCount} عضو`);
    console.log(`   💰 إجمالي التغيير في العمولات: ${totalCommissionChange > 0 ? '+' : ''}${totalCommissionChange} شيكل`);
    console.log(`${'═'.repeat(60)}\n`);

    console.log('✅ اكتملت عملية إعادة الحساب!\n');

  } catch (error) {
    console.error('\n❌ خطأ في إعادة الحساب:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات\n');
    process.exit(0);
  }
}

// تشغيل السكريبت
recalculateAllLeadershipCommissions();
