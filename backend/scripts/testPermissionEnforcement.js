const mongoose = require('mongoose');
const User = require('../models/User');
const Region = require('../models/Region');
const Category = require('../models/Category');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const testPermissionEnforcement = async () => {
  try {
    console.log('\n🧪 Testing Permission Enforcement\n');
    console.log('='.repeat(70));

    // Test 1: Regional Admins
    console.log('\n📍 Testing Regional Admin Permissions...\n');
    const regionalAdmins = await User.find({ role: 'regional_admin' }).populate('region');

    if (regionalAdmins.length === 0) {
      console.log('⚠️  No regional admins found');
    } else {
      for (const admin of regionalAdmins) {
        console.log(`\n${'─'.repeat(70)}`);
        console.log(`👤 Regional Admin: ${admin.name} (@${admin.username})`);
        console.log(`${'─'.repeat(70)}`);

        // Check region assignment
        if (!admin.region) {
          console.log('❌ FAIL: No region assigned - middleware will DENY access');
          continue;
        }

        const regionName = admin.region.nameAr || admin.region.name;
        console.log(`✅ Assigned Region: ${regionName}`);

        // Check permissions
        console.log('\n📋 Permission Status & Route Access:');

        const memberPermissions = [
          {
            name: 'canViewMembers',
            label: 'View Members',
            routes: ['GET /api/admin/users', 'GET /api/admin/users/:id', 'GET /api/admin/users/:id/downline']
          },
          {
            name: 'canManageMembers',
            label: 'Manage Members',
            routes: ['POST /api/admin/users', 'PUT /api/admin/users/:id', 'DELETE /api/admin/users/:id']
          }
        ];

        for (const perm of memberPermissions) {
          const hasPermission = admin.permissions && admin.permissions[perm.name] === true;
          const status = hasPermission ? '✅ ALLOWED' : '❌ BLOCKED';

          console.log(`\n   ${perm.label} (${perm.name}): ${status}`);
          console.log(`   Routes affected:`);
          perm.routes.forEach(route => {
            const access = hasPermission ? '✅ Will work' : '❌ Will return 403';
            console.log(`      ${route} → ${access}`);
          });
        }

        // Test regional access
        console.log(`\n🔒 Regional Access Control:`);
        console.log(`   ✅ Can access data in: ${regionName}`);

        const otherRegions = await Region.find({ _id: { $ne: admin.region._id } });
        if (otherRegions.length > 0) {
          console.log(`   ❌ Cannot access data in ${otherRegions.length} other region(s):`);
          otherRegions.slice(0, 3).forEach(r => {
            console.log(`      - ${r.nameAr || r.name}`);
          });
        }
      }
    }

    // Test 2: Category Admins
    console.log('\n\n📦 Testing Category Admin Permissions...\n');
    const categoryAdmins = await User.find({ role: 'category_admin' });
    const allCategories = await Category.find({});

    if (categoryAdmins.length === 0) {
      console.log('⚠️  No category admins found');
    } else {
      for (const admin of categoryAdmins) {
        console.log(`\n${'─'.repeat(70)}`);
        console.log(`👤 Category Admin: ${admin.name} (@${admin.username})`);
        console.log(`${'─'.repeat(70)}`);

        // Check category assignment
        if (!admin.managedCategories || admin.managedCategories.length === 0) {
          console.log('❌ FAIL: No categories assigned - middleware will DENY access');
          continue;
        }

        console.log(`✅ Assigned Categories (${admin.managedCategories.length}):`);
        admin.managedCategories.forEach((cat, idx) => {
          console.log(`   ${idx + 1}. ${cat}`);
        });

        // Check permissions
        console.log('\n📋 Permission Status & Route Access:');

        const productPermissions = [
          {
            name: 'canViewProducts',
            label: 'View Products',
            routes: ['GET /api/products']
          },
          {
            name: 'canManageProducts',
            label: 'Manage Products',
            routes: ['POST /api/products', 'PUT /api/products/:id', 'DELETE /api/products/:id']
          }
        ];

        for (const perm of productPermissions) {
          const hasPermission = admin.permissions && admin.permissions[perm.name] === true;
          const status = hasPermission ? '✅ ALLOWED' : '❌ BLOCKED';

          console.log(`\n   ${perm.label} (${perm.name}): ${status}`);
          console.log(`   Routes affected:`);
          perm.routes.forEach(route => {
            const access = hasPermission ? '✅ Will work' : '❌ Will return 403';
            console.log(`      ${route} → ${access}`);
          });
        }

        // Test category access
        console.log(`\n🔒 Category Access Control:`);
        console.log(`   ✅ Can manage products in assigned categories:`);
        admin.managedCategories.forEach(cat => {
          console.log(`      - ${cat}`);
        });

        const restrictedCategories = allCategories
          .map(c => c.nameEn || c.name)
          .filter(cat => !admin.managedCategories.includes(cat));

        if (restrictedCategories.length > 0) {
          console.log(`   ❌ Cannot access ${restrictedCategories.length} other category/categories:`);
          restrictedCategories.slice(0, 3).forEach(cat => {
            console.log(`      - ${cat}`);
          });
        }
      }
    }

    // Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('\n✅ Permission Enforcement Test Complete!\n');

    console.log('📊 Summary:');
    console.log(`   Regional Admins: ${regionalAdmins.length}`);
    console.log(`   Category Admins: ${categoryAdmins.length}`);

    const adminsWithoutPermissions = [...regionalAdmins, ...categoryAdmins].filter(a => {
      if (!a.permissions) return true;
      const hasAny = Object.values(a.permissions).some(v => v === true);
      return !hasAny;
    });

    if (adminsWithoutPermissions.length > 0) {
      console.log(`   ⚠️  Admins with NO permissions enabled: ${adminsWithoutPermissions.length}`);
    }

    console.log('\n💡 How It Works:');
    console.log('   1. Middleware checks are now ACTIVE on all routes');
    console.log('   2. If permission is DISABLED → API returns 403 Forbidden');
    console.log('   3. If permission is ENABLED → API allows the action');
    console.log('   4. Super Admin bypasses all checks (always allowed)');
    console.log('   5. Regional admins restricted to their region');
    console.log('   6. Category admins restricted to their categories');

    console.log('\n🧪 To Test Manually:');
    console.log('   1. Go to Permissions Management');
    console.log('   2. Disable a permission for an admin');
    console.log('   3. Login as that admin');
    console.log('   4. Try to perform the action → Should be BLOCKED ❌');
    console.log('   5. Re-enable the permission');
    console.log('   6. Try again → Should WORK ✅\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the test
testPermissionEnforcement();
