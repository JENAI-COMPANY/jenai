require('dotenv').config();
const mongoose = require('mongoose');
const ProfitPeriod = require('../models/ProfitPeriod');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const period = await ProfitPeriod.findOne({ periodName: /شهر 3/ });
  if (!period) { console.log('❌ الدورة غير موجودة'); process.exit(0); }
  console.log(`🗑️ حذف دورة: ${period.periodName} | status=${period.status}`);
  await ProfitPeriod.findByIdAndDelete(period._id);
  console.log('✅ تم الحذف');
  await mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });
