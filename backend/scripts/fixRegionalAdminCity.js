/**
 * تحديث city للمسؤولين الإقليميين ليطابق region
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

async function fixRegionalAdmins() {
  try {
    console.log('\n🔧 تحديث city للمسؤولين الإقليميين...\n');

    const regionalAdmins = await User.find({ role: 'regional_admin' }).populate('region');

    for (const admin of regionalAdmins) {
      console.log(`👮 ${admin.username} (${admin.name})`);
      console.log(`   city الحالي: ${admin.city || 'غير محدد'}`);
      console.log(`   region: ${admin.region?.name || 'غير محدد'}`);

      if (admin.region) {
        admin.city = admin.region.name;
        await admin.save();
        console.log(`   ✅ تم تحديث city إلى: ${admin.city}`);
      } else {
        console.log(`   ⚠️ ليس له region محدد - لا يمكن تحديث city`);
      }
      console.log('');
    }

    console.log('✅ تم الانتهاء من التحديث\n');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق اتصال قاعدة البيانات\n');
  }
}

// تشغيل السكريبت
fixRegionalAdmins();
