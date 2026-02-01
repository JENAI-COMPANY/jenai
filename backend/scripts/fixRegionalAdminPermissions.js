/**
 * إصلاح صلاحيات المسؤول الإقليمي
 * يضيف الصلاحيات المطلوبة للمسؤول الإقليمي لتمكينه من تعديل المستخدمين
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
  managedRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Region' }],
  permissions: {
    canViewMembers: { type: Boolean, default: false },
    canManageMembers: { type: Boolean, default: false },
    canViewOrders: { type: Boolean, default: false },
    canManageOrders: { type: Boolean, default: false },
    canViewProducts: { type: Boolean, default: false },
    canManageProducts: { type: Boolean, default: false },
    canViewCategories: { type: Boolean, default: false },
    canManageCategories: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManagePayments: { type: Boolean, default: false }
  }
}, { strict: false });

const Region = mongoose.model('Region', regionSchema);
const User = mongoose.model('User', userSchema);

async function fixRegionalAdminPermissions() {
  try {
    console.log('\n🔍 البحث عن المسؤولين الإقليميين...');

    // Find all regional admins
    const regionalAdmins = await User.find({ role: 'regional_admin' }).populate('region managedRegions');

    if (regionalAdmins.length === 0) {
      console.log('⚠️ لم يتم العثور على أي مسؤولين إقليميين');
      return;
    }

    console.log(`\n📋 تم العثور على ${regionalAdmins.length} مسؤول إقليمي:\n`);

    for (const admin of regionalAdmins) {
      console.log(`\n👤 المستخدم: ${admin.username} (${admin.name})`);
      console.log(`   الدور: ${admin.role}`);
      console.log(`   المنطقة: ${admin.region?.name || 'غير محدد'}`);
      console.log(`   المناطق المُدارة: ${admin.managedRegions?.map(r => r.name).join(', ') || 'لا يوجد'}`);

      console.log('\n   📊 الصلاحيات الحالية:');
      console.log(`      canViewMembers: ${admin.permissions?.canViewMembers || false}`);
      console.log(`      canManageMembers: ${admin.permissions?.canManageMembers || false}`);
      console.log(`      canViewOrders: ${admin.permissions?.canViewOrders || false}`);
      console.log(`      canManageOrders: ${admin.permissions?.canManageOrders || false}`);
      console.log(`      canViewProducts: ${admin.permissions?.canViewProducts || false}`);
      console.log(`      canManageProducts: ${admin.permissions?.canManageProducts || false}`);

      // تحديث الصلاحيات
      const updatedPermissions = {
        canViewMembers: true,
        canManageMembers: true,  // هذه الصلاحية المهمة لتعديل المستخدمين
        canViewOrders: true,
        canManageOrders: true,
        canViewProducts: true,
        canManageProducts: false,  // عدم السماح بإدارة المنتجات
        canViewCategories: true,
        canManageCategories: false,
        canViewReports: true,
        canManagePayments: false
      };

      admin.permissions = updatedPermissions;
      await admin.save();

      console.log('\n   ✅ تم تحديث الصلاحيات:');
      console.log(`      canViewMembers: ${updatedPermissions.canViewMembers}`);
      console.log(`      canManageMembers: ${updatedPermissions.canManageMembers}`);
      console.log(`      canViewOrders: ${updatedPermissions.canViewOrders}`);
      console.log(`      canManageOrders: ${updatedPermissions.canManageOrders}`);
      console.log(`      canViewProducts: ${updatedPermissions.canViewProducts}`);
      console.log(`      canManageProducts: ${updatedPermissions.canManageProducts}`);
    }

    console.log('\n\n✅ تم إصلاح صلاحيات جميع المسؤولين الإقليميين بنجاح!');
    console.log('\n📝 ملاحظة: يجب على المسؤول الإقليمي تسجيل الخروج ثم الدخول مرة أخرى لتطبيق الصلاحيات الجديدة.\n');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق اتصال قاعدة البيانات');
  }
}

// تشغيل السكريبت
fixRegionalAdminPermissions();
