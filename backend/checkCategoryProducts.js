const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');

  const Product = require('./models/Product');

  // جلب جميع المنتجات
  const allProducts = await Product.find({}).select('name category').lean();
  
  console.log(`📦 إجمالي المنتجات: ${allProducts.length}\n`);

  // جمع جميع الأقسام الفريدة
  const categories = {};
  allProducts.forEach(p => {
    const cat = p.category || 'بدون قسم';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(p.name);
  });

  console.log('📋 الأقسام والمنتجات:\n');
  Object.keys(categories).sort().forEach(cat => {
    console.log(`\n📂 ${cat} (${categories[cat].length} منتج):`);
    categories[cat].slice(0, 5).forEach(name => {
      console.log(`   - ${name}`);
    });
    if (categories[cat].length > 5) {
      console.log(`   ... و ${categories[cat].length - 5} منتج آخر`);
    }
  });

  // البحث عن "قسم خدمات البوجيه"
  console.log('\n\n========================================');
  console.log('🔍 البحث عن: "قسم خدمات البوجيه"');
  console.log('========================================\n');

  const searchTerms = [
    'قسم خدمات البوجيه',
    'خدمات البوجيه',
    'البوجيه',
    'بوجيه'
  ];

  for (const term of searchTerms) {
    const found = allProducts.filter(p => 
      p.category && p.category.includes(term)
    );
    if (found.length > 0) {
      console.log(`✅ وجدت ${found.length} منتج بالقسم "${term}":`);
      found.forEach(p => console.log(`   - ${p.name}`));
      console.log();
    }
  }

  mongoose.disconnect();
  console.log('\n✅ تم الانتهاء');
}).catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
