const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

const resetSuperAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected...');

    // Delete existing super admin
    await User.deleteOne({ role: 'super_admin' });
    console.log('Deleted old super admin...');

    // Create new super admin
    const superAdmin = await User.create({
      username: 'superadmin',
      name: 'Super Administrator',
      email: 'superadmin@networkstore.com',
      password: 'SuperAdmin123!',
      role: 'super_admin',
      phone: '+1234567890',
      permissions: {
        canManageUsers: true,
        canManageProducts: true,
        canManageOrders: true,
        canViewReports: true,
        canManageCommissions: true
      }
    });

    console.log('✅ Super Admin created successfully!');
    console.log('Username:', superAdmin.username);
    console.log('Password: SuperAdmin123!');
    console.log('⚠️  IMPORTANT: Change this password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting super admin:', error);
    process.exit(1);
  }
};

resetSuperAdmin();
