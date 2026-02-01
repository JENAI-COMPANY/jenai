/**
 * مزامنة حقل city مع حقل region
 * يحول أسماء المدن النصية إلى ObjectId للمنطقة المطابقة
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const regionSchema = new mongoose.Schema({
  name: String,
  nameAr: String,
  nameEn: String,
  code: String
}, { strict: false });

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  role: String,
  city: String,
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
  managedRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Region' }]
}, { strict: false });

const Region = mongoose.model('Region', regionSchema);
const User = mongoose.model('User', userSchema);

async function syncCityWithRegion() {
  try {
    console.log('\n🔄 بدء مزامنة city مع region...\n');

    // Get all regions
    const allRegions = await Region.find();
    console.log('📋 المناطق المتاحة:');
    allRegions.forEach(region => {
      console.log(`   - ${region.name} (${region.nameAr || region.name})`);
    });

    console.log('\n' + '='.repeat(80) + '\n');

    // Find all users (members, customers, and admins)
    const users = await User.find().populate('region');

    let fixedCount = 0;
    let alreadyCorrect = 0;
    let cannotFix = 0;

    for (const user of users) {
      console.log(`\n👤 ${user.username} (${user.name}) - ${user.role}`);
      console.log(`   city الحالي: ${user.city || 'غير محدد'}`);
      console.log(`   region الحالي: ${user.region?.name || 'غير محدد'}`);

      // Skip if no city
      if (!user.city) {
        console.log(`   ⏭️ تخطي - ليس له city محدد`);
        continue;
      }

      // Find matching region by name
      const cityName = user.city.trim();
      const matchingRegion = allRegions.find(r =>
        r.name.toLowerCase() === cityName.toLowerCase() ||
        (r.nameAr && r.nameAr.toLowerCase() === cityName.toLowerCase()) ||
        (r.nameEn && r.nameEn.toLowerCase() === cityName.toLowerCase())
      );

      if (matchingRegion) {
        // Check if region is already correct
        if (user.region && user.region._id.toString() === matchingRegion._id.toString()) {
          console.log(`   ✓ city و region متطابقان بالفعل`);
          alreadyCorrect++;
        } else {
          // Update region to match city
          user.region = matchingRegion._id;

          // Also update city to match region name exactly
          user.city = matchingRegion.name;

          await user.save();

          console.log(`   ✅ تم التحديث:`);
          console.log(`      city: ${user.city}`);
          console.log(`      region: ${matchingRegion.name} (ID: ${matchingRegion._id})`);

          fixedCount++;
        }
      } else {
        console.log(`   ⚠️ لا توجد منطقة مطابقة لـ "${cityName}"`);
        console.log(`      يرجى إضافة منطقة جديدة أو تصحيح اسم المدينة يدوياً`);
        cannotFix++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 ملخص العملية:');
    console.log(`   ✅ تم إصلاح ${fixedCount} مستخدم`);
    console.log(`   ✓ ${alreadyCorrect} مستخدم كانوا صحيحين مسبقاً`);
    console.log(`   ⚠️ ${cannotFix} مستخدم لم يمكن إصلاحهم (لا توجد منطقة مطابقة)`);

    if (cannotFix > 0) {
      console.log('\n⚠️ ملاحظة: المدن التي لم يتم العثور على مناطق مطابقة لها:');
      console.log('   يرجى إضافة هذه المناطق أو تحديث أسماء المدن يدوياً');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق اتصال قاعدة البيانات\n');
  }
}

// تشغيل السكريبت
syncCityWithRegion();
