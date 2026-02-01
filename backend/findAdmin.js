const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/jenai-cooperative').then(async () => {
  console.log('متصل بقاعدة البيانات...');

  const admins = await User.find({ role: 'super_admin' }).select('name username city country');
  console.log('المسؤولون الرئيسيون:', admins);

  if (admins.length > 0) {
    console.log('\nتحديث المدينة...');
    const result = await User.updateMany(
      { role: 'super_admin' },
      { $set: { city: 'جنين' } }
    );
    console.log('النتيجة:', result);
  }

  mongoose.connection.close();
}).catch(err => {
  console.error('خطأ:', err);
  process.exit(1);
});
