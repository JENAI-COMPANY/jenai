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

const setupTestPermissions = async () => {
  try {
    console.log('\n🔧 Setting up Test Permissions\n');
    console.log('='.repeat(60));

    // ====== Setup Regional Admins ======
    console.log('\n📍 Setting up Regional Admins...\n');

    const regionalAdmins = await User.find({ role: 'regional_admin' });
    const regions = await Region.find({});

    if (regionalAdmins.length === 0) {
      console.log('⚠️  No regional admins found');
    } else {
      for (const admin of regionalAdmins) {
        // If admin doesn't have a region, assign one
        if (!admin.region && regions.length > 0) {
          const randomRegion = regions[Math.floor(Math.random() * regions.length)];
          admin.region = randomRegion._id;
          console.log(`📍 Assigning region "${randomRegion.nameAr}" to ${admin.name}`);
        }

        // Enable all permissions
        admin.permissions = {
          canViewMembers: true,
          canManageMembers: true,
          canViewProducts: true,
          canManageProducts: true,
          canManageUsers: false,
          canManageOrders: false,
          canViewReports: false,
          canManageCommissions: false
        };

        admin.markModified('permissions');
        await admin.save();

        const regionName = admin.region ?
          (await Region.findById(admin.region))?.nameAr || 'Unknown' :
          'Not Assigned';

        console.log(`✅ ${admin.name} (@${admin.username})`);
        console.log(`   Region: ${regionName}`);
        console.log(`   Permissions: ✅ View Members, ✅ Manage Members, ✅ View Products, ✅ Manage Products`);
      }
    }

    // ====== Setup Category Admins ======
    console.log('\n📦 Setting up Category Admins...\n');

    const categoryAdmins = await User.find({ role: 'category_admin' });
    const categories = await Category.find({});

    if (categoryAdmins.length === 0) {
      console.log('⚠️  No category admins found');
    } else if (categories.length === 0) {
      console.log('⚠️  No categories found in database');
    } else {
      for (let i = 0; i < categoryAdmins.length; i++) {
        const admin = categoryAdmins[i];

        // Assign categories (force reassign for testing)
        if (true) {
          // For testing: assign different number of categories to each admin
          if (i === 0 && categories.length >= 1) {
            // First admin: single category
            const catName = categories[0].nameEn || categories[0].name;
            admin.managedCategories = [catName];
            console.log(`📁 Assigning 1 category to ${admin.name}: ${catName}`);
          } else if (i === 1 && categories.length >= 2) {
            // Second admin: multiple categories
            admin.managedCategories = categories.slice(0, 2).map(c => c.nameEn || c.name);
            console.log(`📁 Assigning ${categories.slice(0, 2).length} categories to ${admin.name}:`);
            categories.slice(0, 2).forEach(c => console.log(`   - ${c.nameEn || c.name}`));
          } else {
            // Other admins: all categories
            admin.managedCategories = categories.map(c => c.nameEn || c.name);
            console.log(`📁 Assigning all ${categories.length} categories to ${admin.name}`);
          }
        }

        // Enable all permissions
        admin.permissions = {
          canViewMembers: true,
          canManageMembers: true,
          canViewProducts: true,
          canManageProducts: true,
          canManageUsers: false,
          canManageOrders: false,
          canViewReports: false,
          canManageCommissions: false
        };

        admin.markModified('permissions');
        admin.markModified('managedCategories');
        await admin.save();

        console.log(`✅ ${admin.name} (@${admin.username})`);
        console.log(`   Categories: ${admin.managedCategories.join(', ')}`);
        console.log(`   Permissions: ✅ View Members, ✅ Manage Members, ✅ View Products, ✅ Manage Products`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test Permissions Setup Complete!\n');

    console.log('📋 Summary:');
    console.log(`   Regional Admins configured: ${regionalAdmins.length}`);
    console.log(`   Category Admins configured: ${categoryAdmins.length}`);
    console.log('\n💡 Tip: Run test scripts to verify permissions:');
    console.log('   • node scripts/testRegionalAdminPermissions.js');
    console.log('   • node scripts/testCategoryAdminPermissions.js\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the setup
setupTestPermissions();
