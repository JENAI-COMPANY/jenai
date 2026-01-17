const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected...');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });

    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.username);
      process.exit(0);
    }

    // Create super admin
    const superAdmin = await User.create({
      username: 'superadmin',
      name: 'Super Administrator',
      email: 'superadmin@networkstore.com',
      password: 'SuperAdmin123!', // Change this password after first login
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

    console.log('Super Admin created successfully!');
    console.log('Username:', superAdmin.username);
    console.log('Password: SuperAdmin123!');
    console.log('⚠️  IMPORTANT: Change this password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
