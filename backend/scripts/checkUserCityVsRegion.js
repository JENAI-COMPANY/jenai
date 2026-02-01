/**
 * فحص الفرق بين حقل city وحقل region في المستخدمين
 * للتأكد من صحة البيانات
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
  city: String,  // حقل نصي بسيط
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },  // ObjectId للمنطقة
  managedRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Region' }]
}, { strict: false });

const Region = mongoose.model('Region', regionSchema);
const User = mongoose.model('User', userSchema);

async function checkCityVsRegion() {
  try {
    console.log('\n🔍 فحص الفرق بين city و region...\n');

    // Get all regions first
    const allRegions = await Region.find();
    console.log('📋 جميع المناطق في قاعدة البيانات:');
    allRegions.forEach(region => {
      console.log(`   - ${region.name} (ID: ${region._id})`);
    });

    console.log('\n' + '='.repeat(80));

    // Find users with role member or customer
    const users = await User.find({
      role: { $in: ['member', 'customer'] }
    }).populate('region');

    console.log(`\n📊 تم العثور على ${users.length} مستخدم (عضو/زبون):\n`);

    let hasOnlyCity = 0;
    let hasOnlyRegion = 0;
    let hasBoth = 0;
    let hasNeither = 0;

    for (const user of users) {
      console.log(`\n👤 ${user.username} (${user.name}) - ${user.role}`);
      console.log(`   city: ${user.city || 'غير محدد'}`);
      console.log(`   region: ${user.region?.name || 'غير محدد'} ${user.region ? `(ID: ${user.region._id})` : ''}`);

      if (user.city && !user.region) {
        hasOnlyCity++;
        console.log(`   ⚠️ المستخدم له city فقط وليس له region!`);
      } else if (!user.city && user.region) {
        hasOnlyRegion++;
        console.log(`   ✓ المستخدم له region فقط`);
      } else if (user.city && user.region) {
        hasBoth++;
        console.log(`   ℹ️ المستخدم له city و region معاً`);

        // Check if city matches region name
        if (user.city.toLowerCase() !== user.region.name.toLowerCase()) {
          console.log(`   ⚠️ city و region غير متطابقين! (city: ${user.city}, region: ${user.region.name})`);
        }
      } else {
        hasNeither++;
        console.log(`   ❌ المستخدم ليس له city ولا region`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📈 ملخص الإحصائيات:');
    console.log(`   - مستخدمون لديهم city فقط: ${hasOnlyCity}`);
    console.log(`   - مستخدمون لديهم region فقط: ${hasOnlyRegion}`);
    console.log(`   - مستخدمون لديهم كلاهما: ${hasBoth}`);
    console.log(`   - مستخدمون ليس لديهم أي منهما: ${hasNeither}`);

    console.log('\n' + '='.repeat(80));

    // Check regional admins
    console.log('\n🔍 فحص المسؤولين الإقليميين:\n');

    const regionalAdmins = await User.find({ role: 'regional_admin' }).populate('region managedRegions');

    for (const admin of regionalAdmins) {
      console.log(`\n👮 ${admin.username} (${admin.name})`);
      console.log(`   city: ${admin.city || 'غير محدد'}`);
      console.log(`   region: ${admin.region?.name || 'غير محدد'}`);
      console.log(`   managedRegions: ${admin.managedRegions?.map(r => r.name).join(', ') || 'غير محدد'}`);
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
checkCityVsRegion();
