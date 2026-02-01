/**
 * التحقق من صلاحيات المسؤولين الإقليميين
 * يتحقق من أن كل مسؤول إقليمي يمكنه الوصول إلى المستخدمين في منطقته
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
    canManageMembers: { type: Boolean, default: false }
  }
}, { strict: false });

const Region = mongoose.model('Region', regionSchema);
const User = mongoose.model('User', userSchema);

async function verifyAccess() {
  try {
    console.log('\n🔍 فحص جميع المسؤولين...\n');

    // Find all admin users (super_admin, regional_admin, category_admin)
    const admins = await User.find({
      role: { $in: ['super_admin', 'regional_admin', 'category_admin'] }
    }).populate('region managedRegions');

    console.log(`📋 تم العثور على ${admins.length} مسؤول:\n`);

    for (const admin of admins) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 اسم المستخدم: ${admin.username}`);
      console.log(`   الاسم: ${admin.name || 'غير محدد'}`);
      console.log(`   الدور: ${admin.role}`);
      console.log(`   المنطقة: ${admin.region?.name || 'غير محدد'}`);

      if (admin.managedRegions && admin.managedRegions.length > 0) {
        console.log(`   المناطق المُدارة: ${admin.managedRegions.map(r => r.name).join(', ')}`);
      } else {
        console.log(`   المناطق المُدارة: لا يوجد`);
      }

      console.log(`\n   📊 الصلاحيات:`);
      console.log(`      canViewMembers: ${admin.permissions?.canViewMembers || false}`);
      console.log(`      canManageMembers: ${admin.permissions?.canManageMembers || false}`);

      // Check if regional admin
      if (admin.role === 'regional_admin') {
        // Find users in the same region
        const usersInRegion = await User.find({
          role: { $in: ['member', 'customer'] },
          region: { $in: admin.managedRegions || [] }
        });

        console.log(`\n   👥 عدد المستخدمين (أعضاء وزبائن) في المنطقة المُدارة: ${usersInRegion.length}`);

        if (usersInRegion.length > 0) {
          console.log(`\n   📝 أمثلة على المستخدمين:`);
          usersInRegion.slice(0, 5).forEach(user => {
            console.log(`      - ${user.username} (${user.name}) - ${user.role}`);
          });
        }

        // Check if can edit
        const canEdit = admin.permissions?.canManageMembers &&
                       admin.managedRegions &&
                       admin.managedRegions.length > 0;

        console.log(`\n   ${canEdit ? '✅' : '❌'} القدرة على تعديل المستخدمين: ${canEdit ? 'نعم' : 'لا'}`);

        if (!canEdit) {
          console.log(`      أسباب عدم القدرة على التعديل:`);
          if (!admin.permissions?.canManageMembers) {
            console.log(`      - ليس لديه صلاحية canManageMembers`);
          }
          if (!admin.managedRegions || admin.managedRegions.length === 0) {
            console.log(`      - ليس لديه مناطق مُدارة`);
          }
        }
      }
    }

    console.log(`\n${'='.repeat(60)}\n`);

    // Check specific user "abdalrhmn"
    console.log('\n🔍 فحص المستخدم المحدد: abdalrhmn\n');
    const targetUser = await User.findOne({ username: 'abdalrhmn' }).populate('region');

    if (targetUser) {
      console.log(`✅ تم العثور على المستخدم:`);
      console.log(`   اسم المستخدم: ${targetUser.username}`);
      console.log(`   الاسم: ${targetUser.name || 'غير محدد'}`);
      console.log(`   الدور: ${targetUser.role}`);
      console.log(`   المنطقة: ${targetUser.region?.name || 'غير محدد'}`);

      // Check which admins can edit this user
      console.log(`\n   👮 المسؤولون الذين يمكنهم تعديل هذا المستخدم:\n`);

      for (const admin of admins) {
        if (admin.role === 'super_admin') {
          console.log(`   ✅ ${admin.username} (super_admin) - يمكنه تعديل جميع المستخدمين`);
        } else if (admin.role === 'regional_admin') {
          const managedRegionIds = (admin.managedRegions || []).map(r => r._id.toString());
          const userRegionId = targetUser.region?._id.toString();
          const hasPermission = admin.permissions?.canManageMembers;
          const hasRegion = managedRegionIds.includes(userRegionId);

          if (hasPermission && hasRegion) {
            console.log(`   ✅ ${admin.username} (regional_admin) - يمكنه التعديل`);
          } else {
            console.log(`   ❌ ${admin.username} (regional_admin) - لا يمكنه التعديل`);
            if (!hasPermission) {
              console.log(`      - ليس لديه صلاحية canManageMembers`);
            }
            if (!hasRegion) {
              console.log(`      - المستخدم ليس في منطقته المُدارة`);
            }
          }
        }
      }
    } else {
      console.log(`❌ لم يتم العثور على المستخدم "abdalrhmn"`);
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 تم إغلاق اتصال قاعدة البيانات\n');
  }
}

// تشغيل السكريبت
verifyAccess();
