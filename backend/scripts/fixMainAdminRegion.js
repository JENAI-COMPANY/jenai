/**
 * تغيير منطقة المسؤول الرئيسي من غزة إلى جنين
 * وتحديث city لتطابق region
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

async function fixMainAdmin() {
  try {
    console.log('\n🔧 تحديث المسؤول الرئيسي...\n');

    // Find جنين region
    const jeninRegion = await Region.findOne({ name: 'جنين' });

    if (!jeninRegion) {
      console.log('❌ لم يتم العثور على منطقة جنين!');
      return;
    }

    console.log(`✅ تم العثور على منطقة جنين (ID: ${jeninRegion._id})\n`);

    // Find main admin (username: admin)
    const admin = await User.findOne({ username: 'admin' }).populate('region managedRegions');

    if (!admin) {
      console.log('❌ لم يتم العثور على المسؤول الرئيسي (admin)');
      return;
    }

    console.log(`👤 المسؤول الرئيسي: ${admin.username} (${admin.name})`);
    console.log(`   الدور: ${admin.role}`);
    console.log(`   المنطقة الحالية: ${admin.region?.name || 'غير محدد'}`);
    console.log(`   city الحالي: ${admin.city || 'غير محدد'}`);
    console.log(`   المناطق المُدارة: ${admin.managedRegions?.map(r => r.name).join(', ') || 'لا يوجد'}`);

    // Update to جنين
    admin.region = jeninRegion._id;
    admin.city = jeninRegion.name;
    admin.managedRegions = [jeninRegion._id];

    await admin.save();

    console.log(`\n✅ تم التحديث بنجاح:`);
    console.log(`   المنطقة الجديدة: جنين`);
    console.log(`   city الجديد: جنين`);
    console.log(`   المناطق المُدارة: جنين`);

    console.log('\n');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق اتصال قاعدة البيانات\n');
  }
}

// تشغيل السكريبت
fixMainAdmin();
