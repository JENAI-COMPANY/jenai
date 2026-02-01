/**
 * إصلاح المناطق المُدارة للمسؤولين الإقليميين
 * إذا كان المسؤول الإقليمي له منطقة (region) ولكن ليس له مناطق مُدارة (managedRegions)،
 * نقوم بإضافة منطقته إلى المناطق المُدارة
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
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
  managedRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Region' }]
}, { strict: false });

const Region = mongoose.model('Region', regionSchema);
const User = mongoose.model('User', userSchema);

async function fixManagedRegions() {
  try {
    console.log('\n🔍 البحث عن المسؤولين الإقليميين الذين يحتاجون إلى إصلاح...');

    // Find all regional admins
    const regionalAdmins = await User.find({ role: 'regional_admin' }).populate('region managedRegions');

    if (regionalAdmins.length === 0) {
      console.log('⚠️ لم يتم العثور على أي مسؤولين إقليميين');
      return;
    }

    console.log(`\n📋 تم العثور على ${regionalAdmins.length} مسؤول إقليمي\n`);

    let fixedCount = 0;

    for (const admin of regionalAdmins) {
      console.log(`\n👤 المستخدم: ${admin.username} (${admin.name})`);
      console.log(`   المنطقة: ${admin.region?.name || 'غير محدد'}`);
      console.log(`   المناطق المُدارة الحالية: ${admin.managedRegions?.map(r => r.name).join(', ') || 'لا يوجد'}`);

      // Check if admin has a region but no managed regions
      if (admin.region && (!admin.managedRegions || admin.managedRegions.length === 0)) {
        console.log(`   ⚠️ المسؤول له منطقة ولكن ليس له مناطق مُدارة!`);

        // Add region to managedRegions
        admin.managedRegions = [admin.region._id];
        await admin.save();

        fixedCount++;
        console.log(`   ✅ تم إضافة المنطقة "${admin.region.name}" إلى المناطق المُدارة`);
      } else if (admin.managedRegions && admin.managedRegions.length > 0) {
        console.log(`   ✓ المناطق المُدارة موجودة بالفعل`);
      } else if (!admin.region) {
        console.log(`   ⚠️ المسؤول ليس له منطقة محددة - يحتاج إلى تعيين منطقة أولاً`);
      }
    }

    console.log(`\n\n✅ تم إصلاح ${fixedCount} من المسؤولين الإقليميين`);

    if (fixedCount > 0) {
      console.log('\n📝 ملاحظة: يجب على المسؤول الإقليمي تسجيل الخروج ثم الدخول مرة أخرى لتطبيق التغييرات.\n');
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق اتصال قاعدة البيانات');
  }
}

// تشغيل السكريبت
fixManagedRegions();
