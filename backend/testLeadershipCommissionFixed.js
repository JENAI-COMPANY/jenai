/**
 * اختبار حساب أرباح القيادة بعد الإصلاح
 * يتحقق من أن الحساب يعمل بناءً على النقاط الشخصية (points) لأعضاء كل جيل
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const { calculateLeadershipCommission, LEADERSHIP_RATES } = require('./utils/calculateLeadershipCommission');
require('dotenv').config();

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jenai')
  .then(() => console.log('✅ متصل بقاعدة البيانات'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

async function testLeadershipCommission() {
  try {
    console.log('\n🧪 ══════════════════════════════════════════════════');
    console.log('   اختبار حساب أرباح القيادة (النظام المصلح)');
    console.log('══════════════════════════════════════════════════\n');

    // جلب جميع الأعضاء الذين لديهم رتبة غير وكيل
    const members = await User.find({
      role: 'member',
      memberRank: { $ne: 'agent' }
    }).select('name username memberRank points leadershipPoints').lean();

    console.log(`📊 عدد الأعضاء المؤهلين لأرباح القيادة: ${members.length}\n`);

    if (members.length === 0) {
      console.log('⚠️  لا يوجد أعضاء مؤهلين لأرباح القيادة');
      console.log('💡 الأعضاء البرونزيين وما فوق فقط يحصلون على أرباح قيادة\n');
      return;
    }

    // اختبار كل عضو
    for (const member of members) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`👤 العضو: ${member.name} (@${member.username})`);
      console.log(`🏆 الرتبة: ${member.memberRank}`);
      console.log(`📈 النقاط الشخصية الحالية: ${member.points || 0}`);
      console.log(`💎 أرباح القيادة الحالية: ${member.leadershipPoints || 0} نقطة`);
      console.log(`${'─'.repeat(60)}`);

      // عرض نسب عمولة القيادة لهذه الرتبة
      const rates = LEADERSHIP_RATES[member.memberRank] || [];
      console.log(`📋 نسب عمولة القيادة حسب الرتبة:`);

      if (rates.length === 0) {
        console.log('   ❌ لا يوجد عمولة قيادة لهذه الرتبة');
      } else {
        rates.forEach((rate, index) => {
          console.log(`   • الجيل ${index + 1}: ${(rate * 100)}%`);
        });
      }

      // حساب أرباح القيادة الجديدة
      console.log(`\n🔄 حساب أرباح القيادة...`);
      const newLeadershipPoints = await calculateLeadershipCommission(member._id);

      console.log(`\n📊 النتيجة:`);
      console.log(`   • أرباح القيادة المحسوبة: ${newLeadershipPoints.toFixed(2)} نقطة`);
      console.log(`   • القيمة بالشيكل: ${Math.floor(newLeadershipPoints * 0.55)} شيكل`);

      const difference = newLeadershipPoints - (member.leadershipPoints || 0);
      if (Math.abs(difference) > 0.01) {
        console.log(`   ⚠️  الفرق عن القيمة المحفوظة: ${difference.toFixed(2)} نقطة`);
        console.log(`   💡 قد تحتاج إلى تحديث البيانات في قاعدة البيانات`);
      } else {
        console.log(`   ✅ الحساب مطابق للقيمة المحفوظة`);
      }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log('\n✅ اكتمل الاختبار بنجاح!\n');
    console.log('📝 ملاحظات:');
    console.log('   • يتم الحساب بناءً على النقاط الشخصية (points) لكل عضو في الجيل');
    console.log('   • النسب تختلف حسب رتبة العضو:');
    console.log('     - برونزي: جيل 1 فقط (5%)');
    console.log('     - فضي: أجيال 1-2 (5%, 4%)');
    console.log('     - ذهبي: أجيال 1-3 (5%, 4%, 3%)');
    console.log('     - ياقوتي: أجيال 1-4 (5%, 4%, 3%, 2%)');
    console.log('     - ماسي وما فوق: أجيال 1-5 (5%, 4%, 3%, 2%, 1%)\n');

  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات\n');
    process.exit(0);
  }
}

// تشغيل الاختبار
testLeadershipCommission();
