const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');

  const Category = require('./models/Category');
  const Product = require('./models/Product');

  // جلب جميع الفئات
  const categories = await Category.find({}).lean();

  console.log('\n========================================');
  console.log('جميع الفئات في النظام:');
  console.log('========================================\n');

  for (const cat of categories) {
    // عد المنتجات في كل فئة
    const productCount = await Product.countDocuments({ category: cat.nameAr });

    console.log(`الفئة: "${cat.nameAr}"`);
    if (cat.name && cat.name !== cat.nameAr) {
      console.log(`   الاسم الإنجليزي: "${cat.name}"`);
    }
    console.log(`   عدد المنتجات: ${productCount}`);
    console.log(`   معرّف الفئة: ${cat._id}`);
    console.log('---');
  }

  // البحث عن أي فئة تحتوي على "بوجيه" أو "سوشيال"
  console.log('\n========================================');
  console.log('البحث عن فئات مشابهة:');
  console.log('========================================\n');

  const similarCats = categories.filter(cat =>
    cat.nameAr.includes('بوجيه') ||
    cat.nameAr.includes('سوشيال') ||
    cat.nameAr.includes('ميديا')
  );

  if (similarCats.length > 0) {
    console.log('الفئات المشابهة المحتوية على "بوجيه" أو "سوشيال" أو "ميديا":');
    similarCats.forEach(cat => {
      console.log(`   - "${cat.nameAr}"`);
    });
  }

  // فحص المنتجات التي تحتوي على هذه الفئات
  const productsWithCategory = await Product.find({
    category: { $in: ['قسم خدمات البوجيه بيديا', 'قسم خدمات السوشيال ميديا'] }
  }).select('name category').lean();

  console.log('\n========================================');
  console.log('المنتجات في الفئات المشتبه بها:');
  console.log('========================================\n');

  const groupedByCategory = {};
  productsWithCategory.forEach(p => {
    if (!groupedByCategory[p.category]) {
      groupedByCategory[p.category] = [];
    }
    groupedByCategory[p.category].push(p.name);
  });

  for (const [catName, products] of Object.entries(groupedByCategory)) {
    console.log(`الفئة: "${catName}"`);
    console.log(`عدد المنتجات: ${products.length}`);
    console.log('أول 5 منتجات:');
    products.slice(0, 5).forEach((name, i) => {
      console.log(`   ${i + 1}. ${name}`);
    });
    console.log('---\n');
  }

  mongoose.disconnect();
  console.log('تم');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
