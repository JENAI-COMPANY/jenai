const mongoose = require('mongoose');
const User = require('../models/User');
const Region = require('../models/Region');
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

const testRegionalAdminPermissions = async () => {
  try {
    console.log('\n🧪 Testing Regional Admin Permissions\n');
    console.log('='.repeat(60));

    // Get all regional admins
    const regionalAdmins = await User.find({ role: 'regional_admin' }).populate('region');

    if (regionalAdmins.length === 0) {
      console.log('❌ No regional admins found in database');
      process.exit(0);
    }

    console.log(`\n📊 Found ${regionalAdmins.length} regional admin(s)\n`);

    for (const admin of regionalAdmins) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`👤 Regional Admin: ${admin.name} (@${admin.username})`);
      console.log(`${'─'.repeat(60)}`);

      // Check region assignment
      if (!admin.region) {
        console.log('❌ FAIL: No region assigned!');
        console.log('   ⚠️  This admin cannot access any regional data');
        continue;
      }

      const regionName = admin.region.nameAr || admin.region.name;
      console.log(`✅ Region: ${regionName}`);

      // Check permissions
      console.log('\n📋 Permissions Check:');

      const permissions = [
        { name: 'canViewMembers', label: 'View Members' },
        { name: 'canManageMembers', label: 'Manage Members' },
        { name: 'canViewProducts', label: 'View Products' },
        { name: 'canManageProducts', label: 'Manage Products' }
      ];

      let hasAnyPermission = false;
      for (const perm of permissions) {
        const hasPermission = admin.permissions && admin.permissions[perm.name] === true;
        const status = hasPermission ? '✅' : '❌';
        console.log(`   ${status} ${perm.label}: ${hasPermission ? 'ENABLED' : 'DISABLED'}`);
        if (hasPermission) hasAnyPermission = true;
      }

      if (!hasAnyPermission) {
        console.log('\n   ⚠️  WARNING: This admin has NO permissions enabled!');
        console.log('   📝 Recommendation: Enable permissions in Permissions Management');
      }

      // Check members in this region
      const membersCount = await User.countDocuments({
        role: 'member',
        region: admin.region._id
      });

      console.log(`\n📊 Data in Region "${regionName}":`);
      console.log(`   👥 Members: ${membersCount}`);

      // Test Access Scenarios
      console.log('\n🧪 Access Test Results:');

      if (admin.permissions && admin.permissions.canViewMembers) {
        console.log(`   ✅ CAN view ${membersCount} member(s) in ${regionName}`);
      } else {
        console.log(`   ❌ CANNOT view members in ${regionName} (permission disabled)`);
      }

      if (admin.permissions && admin.permissions.canManageMembers) {
        console.log(`   ✅ CAN manage members in ${regionName}`);
      } else {
        console.log(`   ❌ CANNOT manage members in ${regionName} (permission disabled)`);
      }

      if (admin.permissions && admin.permissions.canViewProducts) {
        console.log(`   ✅ CAN view products in ${regionName}`);
      } else {
        console.log(`   ❌ CANNOT view products in ${regionName} (permission disabled)`);
      }

      if (admin.permissions && admin.permissions.canManageProducts) {
        console.log(`   ✅ CAN manage products in ${regionName}`);
      } else {
        console.log(`   ❌ CANNOT manage products in ${regionName} (permission disabled)`);
      }

      // Check if admin can access OTHER regions
      const otherRegions = await Region.find({ _id: { $ne: admin.region._id } });
      if (otherRegions.length > 0) {
        console.log(`\n🚫 Access Restrictions:`);
        console.log(`   ❌ CANNOT access data from ${otherRegions.length} other region(s):`);
        otherRegions.forEach(region => {
          console.log(`      - ${region.nameAr || region.name}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Regional Admin Permissions Test Complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the test
testRegionalAdminPermissions();
