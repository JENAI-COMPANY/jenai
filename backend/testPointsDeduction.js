/**
 * سكريبت لاختبار طرح النقاط بعد احتساب الأرباح
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testDeduction = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 حالة النقاط قبل احتساب الأرباح:\n');

    const members = await User.find({
      username: { $in: ['kk', 'jkjk', 'ggg', 'ghgh'] }
    }).select('name username monthlyPoints generation1Points generation2Points generation3Points');

    for (const member of members) {
      console.log(`👤 ${member.name} (@${member.username})`);
      console.log(`   monthlyPoints: ${member.monthlyPoints || 0}`);
      console.log(`   generation1Points: ${member.generation1Points || 0}`);
      console.log(`   generation2Points: ${member.generation2Points || 0}`);
      console.log(`   generation3Points: ${member.generation3Points || 0}\n`);
    }

    console.log('='.repeat(80));
    console.log('\n📝 ملاحظة: بعد احتساب الأرباح من الفرونت اند، قم بتشغيل هذا السكريبت مرة أخرى');
    console.log('    للتأكد من أن النقاط تم طرحها بنجاح.\n');
    console.log('المتوقع بعد احتساب الأرباح:');
    console.log('  - جميع النقاط (monthlyPoints و generationPoints) يجب أن تكون = 0');
    console.log('  - أي نقاط جديدة بعد الاحتساب ستبقى موجودة\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testDeduction();
