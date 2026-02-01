const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/jenai-cooperative', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('متصل بقاعدة البيانات...');

  // تحديث المسؤول الرئيسي
  const result = await User.updateOne(
    {
      role: 'super_admin'
    },
    {
      $set: { city: 'جنين' }
    }
  );

  console.log('✅ تم تحديث المدينة:', result);

  mongoose.connection.close();
  console.log('تم إغلاق الاتصال');
}).catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
