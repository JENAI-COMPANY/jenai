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

const updateMemberCodes = async () => {
  try {
    console.log('\n🔄 تحديث أكواد الأعضاء لاستخدام الأحرف الإنجليزية الصحيحة للدول\n');
    console.log('='.repeat(70));

    // خريطة أسماء الدول إلى حروفها الإنجليزية الصحيحة
    const countryCodeMap = {
      'فلسطين': 'P',  // Palestine
      'الأردن': 'J',   // Jordan
      'مصر': 'E',      // Egypt
      'سوريا': 'S',    // Syria
      'لبنان': 'L',    // Lebanon
      'العراق': 'I',   // Iraq
      'السعودية': 'S', // Saudi Arabia
      'الإمارات': 'U', // UAE
      'الكويت': 'K',   // Kuwait
      'قطر': 'Q',      // Qatar
      'عمان': 'O',     // Oman
      'اليمن': 'Y',    // Yemen
      'المغرب': 'M',   // Morocco
      'الجزائر': 'A',  // Algeria
      'تونس': 'T',     // Tunisia
      'ليبيا': 'L',    // Libya
      'السودان': 'S',  // Sudan
      'palestine': 'P',
      'jordan': 'J',
      'egypt': 'E',
      'syria': 'S',
      'lebanon': 'L',
      'iraq': 'I'
    };

    // خريطة تحويل الأحرف العربية إلى الإنجليزية (للمدن)
    const arabicToEnglish = {
      'ا': 'A', 'أ': 'A', 'إ': 'A', 'آ': 'A',
      'ب': 'B',
      'ت': 'T', 'ث': 'T',
      'ج': 'J',
      'ح': 'H', 'خ': 'K',
      'د': 'D', 'ذ': 'D',
      'ر': 'R', 'ز': 'Z',
      'س': 'S', 'ش': 'S',
      'ص': 'S', 'ض': 'D',
      'ط': 'T', 'ظ': 'Z',
      'ع': 'A', 'غ': 'G',
      'ف': 'F',
      'ق': 'Q',
      'ك': 'K',
      'ل': 'L',
      'م': 'M',
      'ن': 'N',
      'ه': 'H',
      'و': 'W',
      'ي': 'Y', 'ى': 'Y',
      'ة': 'H'
    };

    const getCorrectCountryCode = (country) => {
      if (!country) return null;

      const lowerCountry = country.trim().toLowerCase();
      if (countryCodeMap[lowerCountry]) {
        return countryCodeMap[lowerCountry];
      }
      if (countryCodeMap[country.trim()]) {
        return countryCodeMap[country.trim()];
      }

      // إذا لم نجد في الخريطة، استخدم الحرف الأول المُترجَم
      const firstChar = country.charAt(0);
      return arabicToEnglish[firstChar] || firstChar.toUpperCase();
    };

    const getCityCode = (city) => {
      if (!city) return 'X';
      const firstChar = city.charAt(0);
      return arabicToEnglish[firstChar] || firstChar.toUpperCase();
    };

    // جلب جميع المستخدمين الذين لديهم subscriberCode
    const users = await User.find({
      subscriberCode: { $exists: true, $ne: null, $ne: '' }
    }).select('subscriberCode country city name username');

    console.log(`📊 عدد المستخدمين الذين لديهم كود عضوية: ${users.length}\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];

    for (const user of users) {
      if (!user.subscriberCode || user.subscriberCode.length < 8) {
        console.log(`⚠️  تخطي ${user.name} - كود غير صالح: ${user.subscriberCode}`);
        skippedCount++;
        continue;
      }

      const currentCode = user.subscriberCode;
      const currentCountryChar = currentCode.charAt(0);
      const currentCityChar = currentCode.charAt(1);
      const digits = currentCode.substring(2);

      // احصل على الحرف الصحيح للدولة
      const correctCountryChar = getCorrectCountryCode(user.country);
      const correctCityChar = getCityCode(user.city);

      if (!correctCountryChar) {
        console.log(`⚠️  تخطي ${user.name} - لا توجد دولة محددة`);
        skippedCount++;
        continue;
      }

      // تحقق إذا كان الكود يحتاج تحديث
      if (currentCountryChar === correctCountryChar && currentCityChar === correctCityChar) {
        console.log(`✓ ${user.name} (@${user.username}): ${currentCode} - لا يحتاج تحديث`);
        skippedCount++;
        continue;
      }

      const newCode = `${correctCountryChar}${correctCityChar}${digits}`;

      // تحقق من أن الكود الجديد فريد
      const existingUser = await User.findOne({
        subscriberCode: newCode,
        _id: { $ne: user._id }
      });

      if (existingUser) {
        console.log(`⚠️  تعارض: ${user.name} - الكود ${newCode} موجود مسبقاً`);
        console.log(`   سيتم توليد كود جديد بالكامل...`);

        // توليد كود جديد بالكامل
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        const brandNewCode = `${correctCountryChar}${correctCityChar}${randomDigits}`;

        updates.push({
          user,
          oldCode: currentCode,
          newCode: brandNewCode,
          country: user.country,
          city: user.city,
          reason: 'تعارض - كود جديد'
        });
      } else {
        updates.push({
          user,
          oldCode: currentCode,
          newCode: newCode,
          country: user.country,
          city: user.city,
          reason: 'تحديث حرف الدولة'
        });
      }
    }

    // عرض ملخص التغييرات قبل التطبيق
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 التغييرات المقترحة:\n');

    if (updates.length === 0) {
      console.log('✅ لا توجد تغييرات مطلوبة - جميع الأكواد صحيحة!\n');
      process.exit(0);
    }

    updates.forEach((update, index) => {
      console.log(`${index + 1}. ${update.user.name} (@${update.user.username})`);
      console.log(`   الدولة: ${update.country} | المدينة: ${update.city}`);
      console.log(`   ${update.oldCode} → ${update.newCode}`);
      console.log(`   السبب: ${update.reason}\n`);
    });

    console.log('='.repeat(70));
    console.log(`\n📊 إجمالي التحديثات: ${updates.length}`);
    console.log(`⏭️  تم تخطي: ${skippedCount}`);
    console.log('\n⚠️  هل تريد تطبيق هذه التغييرات؟');
    console.log('   قم بتشغيل السكريبت مرة أخرى مع المعامل --confirm للتأكيد\n');

    // إذا تم تمرير --confirm، قم بالتحديث
    if (process.argv.includes('--confirm')) {
      console.log('\n🔄 جاري تطبيق التحديثات...\n');

      for (const update of updates) {
        try {
          update.user.subscriberCode = update.newCode;
          await update.user.save();
          console.log(`✅ ${update.user.name}: ${update.oldCode} → ${update.newCode}`);
          updatedCount++;
        } catch (err) {
          console.error(`❌ خطأ في تحديث ${update.user.name}:`, err.message);
        }
      }

      console.log('\n' + '='.repeat(70));
      console.log(`\n✅ تم التحديث بنجاح!`);
      console.log(`   عدد الأكواد المحدثة: ${updatedCount}`);
      console.log(`   عدد المتخطاة: ${skippedCount}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
};

// Run the script
updateMemberCodes();
