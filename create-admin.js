const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = 'mongodb://104.218.48.119:27017/jenai_db';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'member', 'supplier', 'regional_admin', 'super_admin'], default: 'customer' },
  phone: String,
  country: String,
  city: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');

      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'super_admin';
      existingAdmin.name = 'Super Admin';
      await existingAdmin.save();

      console.log('✅ Admin password updated to: admin123');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Create admin user
      const admin = new User({
        username: 'admin',
        name: 'Super Admin',
        password: hashedPassword,
        role: 'super_admin',
        phone: '0000000000',
        country: 'فلسطين',
        city: 'غزة'
      });

      await admin.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('');
    console.log('📝 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');

    await mongoose.connection.close();
    console.log('👋 Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
