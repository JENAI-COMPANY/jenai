const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

const User = require('../models/User');

async function deleteTestUsers() {
  try {
    // Delete all test users (those with usernames ending in _test1, _test2, etc.)
    const result = await User.deleteMany({
      username: { $regex: /_test[1-5]$/ }
    });

    console.log(`\n✅ تم حذف ${result.deletedCount} مستخدم اختباري من قاعدة البيانات\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

deleteTestUsers();
