const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');

  const Product = require('./models/Product');
  const Region = require('./models/Region');

  const categoryName = 'قسم خدمات السوشيال ميديا';

  const products = await Product.find({ category: categoryName })
    .select('name category stock isActive region')
    .populate('region', 'nameAr')
    .lean();

  console.log('\n========================================');
  console.log(`منتجات: "${categoryName}"`);
  console.log('========================================\n');

  console.log(`إجمالي المنتجات: ${products.length}\n`);

  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   المخزون: ${p.stock}`);
    console.log(`   نشط: ${p.isActive ? 'نعم' : 'لا'}`);
    console.log(`   المنطقة: ${p.region ? p.region.nameAr : 'عام لجميع المناطق'}`);
    console.log(`   Category: "${p.category}"`);
    console.log('');
  });

  // إحصائيات
  const inStock = products.filter(p => p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock <= 0).length;
  const active = products.filter(p => p.isActive).length;
  const inactive = products.filter(p => !p.isActive).length;

  console.log('========================================');
  console.log('الإحصائيات:');
  console.log('========================================');
  console.log(`متوفر في المخزون: ${inStock}`);
  console.log(`نفد من المخزون: ${outOfStock}`);
  console.log(`نشط: ${active}`);
  console.log(`غير نشط: ${inactive}`);

  mongoose.disconnect();
  console.log('\n✅ تم');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
