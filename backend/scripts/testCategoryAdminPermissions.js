const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
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

const testCategoryAdminPermissions = async () => {
  try {
    console.log('\n🧪 Testing Category Admin Permissions\n');
    console.log('='.repeat(60));

    // Get all category admins
    const categoryAdmins = await User.find({ role: 'category_admin' });

    if (categoryAdmins.length === 0) {
      console.log('❌ No category admins found in database');
      process.exit(0);
    }

    console.log(`\n📊 Found ${categoryAdmins.length} category admin(s)\n`);

    // Get all categories
    const allCategories = await Category.find({});
    const allCategoryNames = allCategories.map(c => c.nameEn);

    for (const admin of categoryAdmins) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`👤 Category Admin: ${admin.name} (@${admin.username})`);
      console.log(`${'─'.repeat(60)}`);

      // Check categories assignment
      if (!admin.managedCategories || admin.managedCategories.length === 0) {
        console.log('❌ FAIL: No categories assigned!');
        console.log('   ⚠️  This admin cannot manage any categories');
        console.log('   📝 Recommendation: Assign categories in Category Management');
        continue;
      }

      console.log(`✅ Assigned Categories (${admin.managedCategories.length}):`);
      admin.managedCategories.forEach((cat, idx) => {
        console.log(`   ${idx + 1}. ${cat}`);
      });

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

      // Check products in managed categories
      console.log(`\n📦 Products in Managed Categories:`);
      for (const category of admin.managedCategories) {
        const productsCount = await Product.countDocuments({
          category: category,
          isActive: true
        });
        console.log(`   📁 ${category}: ${productsCount} product(s)`);
      }

      // Test Access Scenarios
      console.log('\n🧪 Access Test Results:');

      if (admin.permissions && admin.permissions.canViewProducts) {
        console.log(`   ✅ CAN view products in assigned categories:`);
        admin.managedCategories.forEach(cat => {
          console.log(`      - ${cat}`);
        });
      } else {
        console.log(`   ❌ CANNOT view products (permission disabled)`);
      }

      if (admin.permissions && admin.permissions.canManageProducts) {
        console.log(`   ✅ CAN add/edit/delete products in assigned categories:`);
        admin.managedCategories.forEach(cat => {
          console.log(`      - ${cat}`);
        });
      } else {
        console.log(`   ❌ CANNOT manage products (permission disabled)`);
      }

      // Check restricted categories
      const restrictedCategories = allCategoryNames.filter(
        cat => !admin.managedCategories.includes(cat)
      );

      if (restrictedCategories.length > 0) {
        console.log(`\n🚫 Access Restrictions:`);
        console.log(`   ❌ CANNOT access products from ${restrictedCategories.length} other category/categories:`);
        restrictedCategories.forEach(cat => {
          console.log(`      - ${cat}`);
        });
      } else {
        console.log(`\n✅ This admin manages ALL categories (${admin.managedCategories.length})`);
      }

      // Multi-category support check
      if (admin.managedCategories.length > 1) {
        console.log(`\n🎯 Multi-Category Admin:`);
        console.log(`   ✅ This admin manages ${admin.managedCategories.length} categories simultaneously`);
        console.log(`   📝 Can switch between categories to manage their products`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Category Admin Permissions Test Complete!\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total Category Admins: ${categoryAdmins.length}`);

    const adminsWithCategories = categoryAdmins.filter(a => a.managedCategories && a.managedCategories.length > 0);
    console.log(`   Admins with Categories: ${adminsWithCategories.length}`);

    const adminsWithoutCategories = categoryAdmins.length - adminsWithCategories.length;
    if (adminsWithoutCategories > 0) {
      console.log(`   ⚠️  Admins without Categories: ${adminsWithoutCategories}`);
    }

    const multiCategoryAdmins = categoryAdmins.filter(a => a.managedCategories && a.managedCategories.length > 1);
    if (multiCategoryAdmins.length > 0) {
      console.log(`   🎯 Multi-Category Admins: ${multiCategoryAdmins.length}`);
    }

    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the test
testCategoryAdminPermissions();
