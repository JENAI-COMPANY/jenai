const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/network-marketing');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phone: String,
  role: String,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);

async function createRegionalAdmin() {
  try {
    console.log('Creating regional admin account...');

    const username = 'regionaladmin';
    const password = 'admin123'; // You should change this after first login
    const name = 'Regional Admin';

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Regional admin already exists!');
      console.log(`Username: ${username}`);
      console.log('To reset password, delete this user first.');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create regional admin
    const regionalAdmin = await User.create({
      username,
      password: hashedPassword,
      name,
      phone: '+1234567890',
      role: 'regional_admin',
      isActive: true
    });

    console.log('✅ Regional admin created successfully!');
    console.log('\nLogin credentials:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Role: regional_admin`);
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating regional admin:', error);
    process.exit(1);
  }
}

createRegionalAdmin();
