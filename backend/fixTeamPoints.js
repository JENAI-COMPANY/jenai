/**
 * سكريبت لتصحيح نقاط الفريق للاختبار
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const fixPoints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // الشجرة: ghgh → ggg → jkjk → kk
    // كل واحد عنده 200 نقطة شخصية

    const kk = await User.findOne({ username: 'kk' });
    const jkjk = await User.findOne({ username: 'jkjk' });
    const ggg = await User.findOne({ username: 'ggg' });
    const ghgh = await User.findOne({ username: 'ghgh' });

    // تصفير نقاط الفريق أولاً
    kk.generation1Points = 0;
    kk.generation2Points = 0;
    kk.generation3Points = 0;

    // jkjk: استلم من kk (200 نقطة)
    jkjk.generation1Points = 200 * 0.11; // 22

    // ggg: استلم من jkjk و kk
    ggg.generation1Points = 200 * 0.11; // 22 من jkjk
    ggg.generation2Points = 200 * 0.08; // 16 من kk

    // ghgh: استلم من ggg و jkjk و kk
    ghgh.generation1Points = 200 * 0.11; // 22 من ggg
    ghgh.generation2Points = 200 * 0.08; // 16 من jkjk
    ghgh.generation3Points = 200 * 0.06; // 12 من kk

    await kk.save();
    await jkjk.save();
    await ggg.save();
    await ghgh.save();

    console.log('✅ Fixed team points!\n');
    console.log('kk: 200 شخصي + 0 فريق = 200');
    console.log('jkjk: 200 شخصي + 22 فريق = 222');
    console.log('ggg: 200 شخصي + (22+16) فريق = 238');
    console.log('ghgh: 200 شخصي + (22+16+12) فريق = 250\n');

    console.log('الأرباح المتوقعة:');
    console.log('kk: 200*20%*0.55 = 22 شيكل');
    console.log('jkjk: (200*20% + 22)*0.55 = 34 شيكل');
    console.log('ggg: (200*20% + 38)*0.55 = 42 شيكل');
    console.log('ghgh: (200*20% + 50)*0.55 = 49 شيكل');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixPoints();
