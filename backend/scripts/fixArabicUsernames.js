const mongoose = require('mongoose');
const User = require('../models/User');
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

// Function to check if string contains Arabic characters
const containsArabic = (str) => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(str);
};

// Function to transliterate Arabic to English (simple version)
const arabicToEnglish = (arabicText) => {
  const arabicToEnglishMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
    'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ى': 'a', 'ة': 'h',
    'ء': '', 'ئ': 'e', 'ؤ': 'o',
    // Vowels
    'َ': 'a', 'ُ': 'u', 'ِ': 'i',
    'ً': 'an', 'ٌ': 'un', 'ٍ': 'in',
    'ْ': '', 'ّ': ''
  };

  let result = '';
  for (let char of arabicText) {
    result += arabicToEnglishMap[char] || char;
  }

  // Remove any remaining non-English characters and clean up
  result = result.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();

  // If result is empty or too short, generate a random username
  if (!result || result.length < 3) {
    result = 'user' + Math.random().toString(36).substring(2, 10);
  }

  return result;
};

// Main function to fix usernames
const fixArabicUsernames = async () => {
  try {
    console.log('🔍 Searching for users with Arabic usernames...\n');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} total users`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (containsArabic(user.username)) {
        const oldUsername = user.username;
        let newUsername = arabicToEnglish(oldUsername);

        // Check if username already exists
        let counter = 1;
        let checkUsername = newUsername;
        while (await User.findOne({ username: checkUsername, _id: { $ne: user._id } })) {
          checkUsername = newUsername + counter;
          counter++;
        }
        newUsername = checkUsername;

        console.log(`📝 Fixing: "${oldUsername}" -> "${newUsername}"`);

        // Update username (skip validation temporarily)
        await User.updateOne(
          { _id: user._id },
          { $set: { username: newUsername } }
        );

        fixedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} Arabic usernames`);
    console.log(`⏭️  Skipped ${skippedCount} English usernames`);
    console.log('\n✅ Done!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the script
fixArabicUsernames();
