/**
 * فحص عمولات القيادة الحالية للأعضاء الفضيين والذهبيين
 * للتأكد من تأثير التعديل
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const LEADERSHIP_RATES_OLD = {
  'gold': [0.05, 0.04], // كان خطأ
  'silver': [0.05, 0.04, 0.03], // كان خطأ
};

const LEADERSHIP_RATES_NEW = {
  'silver': [0.05, 0.04], // صحيح الآن
  'gold': [0.05, 0.04, 0.03], // صحيح الآن
};

async function checkLeadershipCommissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ اتصال بقاعدة البيانات نجح\n');

    // البحث عن الأعضاء الفضيين والذهبيين
    const silverMembers = await User.find({ rank: 'silver', role: 'member' })
      .select('name username rank leadershipCommission expectedProfit totalPoints')
      .lean();

    const goldMembers = await User.find({ rank: 'gold', role: 'member' })
      .select('name username rank leadershipCommission expectedProfit totalPoints')
      .lean();

    console.log('='.repeat(70));
    console.log('📊 الأعضاء الفضيون (SILVER)');
    console.log('='.repeat(70));
    console.log(`إجمالي: ${silverMembers.length} عضو`);

    if (silverMembers.length > 0) {
      console.log('\n⚠️ تأثير التعديل: سيحصلون على عمولة قيادة أقل (جيلين بدلاً من 3)');
      console.log('\nالأعضاء المتأثرون:');
      silverMembers.forEach((member, index) => {
        console.log(`${index + 1}. ${member.name} (@${member.username})`);
        console.log(`   عمولة القيادة الحالية: ${member.leadershipCommission || 0} شيكل`);
        console.log(`   الربح المتوقع: ${member.expectedProfit || 0} شيكل`);
      });
    } else {
      console.log('✅ لا يوجد أعضاء فضيون حالياً');
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 الأعضاء الذهبيون (GOLD)');
    console.log('='.repeat(70));
    console.log(`إجمالي: ${goldMembers.length} عضو`);

    if (goldMembers.length > 0) {
      console.log('\n✅ تأثير التعديل: سيحصلون على عمولة قيادة أكبر (3 أجيال بدلاً من جيلين)');
      console.log('\nالأعضاء المتأثرون:');
      goldMembers.forEach((member, index) => {
        console.log(`${index + 1}. ${member.name} (@${member.username})`);
        console.log(`   عمولة القيادة الحالية: ${member.leadershipCommission || 0} شيكل`);
        console.log(`   الربح المتوقع: ${member.expectedProfit || 0} شيكل`);
      });
    } else {
      console.log('✅ لا يوجد أعضاء ذهبيون حالياً');
    }

    // البحث عن جميع الرتب
    console.log('\n' + '='.repeat(70));
    console.log('📈 توزيع الرتب في النظام');
    console.log('='.repeat(70));

    const ranks = ['agent', 'bronze', 'silver', 'gold', 'ruby', 'diamond', 'double_diamond'];

    for (const rank of ranks) {
      const count = await User.countDocuments({ rank, role: 'member' });
      const emoji = {
        'agent': '🔰',
        'bronze': '🥉',
        'silver': '🥈',
        'gold': '🥇',
        'ruby': '💎',
        'diamond': '💎💎',
        'double_diamond': '💎💎💎'
      }[rank] || '📌';

      console.log(`${emoji} ${rank.toUpperCase()}: ${count} أعضاء`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ ملخص التأثير');
    console.log('='.repeat(70));
    console.log(`\n📉 الأعضاء الفضيون (${silverMembers.length}): ستقل عمولة القيادة في الطلبات الجديدة`);
    console.log(`📈 الأعضاء الذهبيون (${goldMembers.length}): ستزيد عمولة القيادة في الطلبات الجديدة`);
    console.log('\n💡 ملاحظة: التعديل يؤثر على الطلبات الجديدة فقط');
    console.log('   الطلبات السابقة محفوظة بالحسابات القديمة\n');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkLeadershipCommissions();
