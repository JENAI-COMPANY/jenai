const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');

  const Category = require('./models/Category');
  const Product = require('./models/Product');

  // 1. الأقسام من جدول Categories
  console.log('📋 الأقسام من جدول Categories:');
  const categories = await Category.find({}).lean();
  console.log(`   عدد الأقسام: ${categories.length}\n`);
  
  categories.forEach((cat, i) => {
    console.log(`${i + 1}. ${cat.nameAr || cat.name}`);
    console.log(`   الاسم بالإنجليزي: ${cat.nameEn || cat.name}`);
    console.log(`   ID: ${cat._id}`);
    console.log();
  });

  // 2. الأقسام الفعلية المستخدمة في المنتجات
  console.log('\n========================================');
  console.log('📦 الأقسام الفعلية في المنتجات:');
  console.log('========================================\n');
  
  const products = await Product.find({}).select('category').lean();
  const usedCategories = {};
  
  products.forEach(p => {
    const cat = p.category || 'بدون قسم';
    usedCategories[cat] = (usedCategories[cat] || 0) + 1;
  });

  Object.keys(usedCategories).sort().forEach(cat => {
    console.log(`📂 ${cat}: ${usedCategories[cat]} منتج`);
  });

  // 3. المقارنة
  console.log('\n========================================');
  console.log('🔍 المقارنة:');
  console.log('========================================\n');

  const categoryNames = categories.map(c => c.nameAr || c.name);
  const usedCategoryNames = Object.keys(usedCategories);

  console.log('✅ الأقسام في جدول Categories لكن ليست في المنتجات:');
  categoryNames.forEach(name => {
    if (!usedCategoryNames.includes(name)) {
      console.log(`   - ${name}`);
    }
  });

  console.log('\n⚠️  الأقسام في المنتجات لكن ليست في جدول Categories:');
  usedCategoryNames.forEach(name => {
    if (!categoryNames.includes(name)) {
      console.log(`   - ${name}`);
    }
  });

  // 4. البحث عن "قسم خدمات السوشيال ميديا"
  console.log('\n========================================');
  console.log('🔍 قسم خدمات السوشيال ميديا:');
  console.log('========================================\n');

  const socialMediaProducts = await Product.find({ 
    category: 'قسم خدمات السوشيال ميديا' 
  }).select('name').lean();

  console.log(`📦 عدد المنتجات: ${socialMediaProducts.length}`);
  if (socialMediaProducts.length > 0) {
    console.log('المنتجات:');
    socialMediaProducts.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name}`);
    });
    if (socialMediaProducts.length > 5) {
      console.log(`   ... و ${socialMediaProducts.length - 5} منتج آخر`);
    }
  }

  // هل يوجد في جدول Categories؟
  const categoryInDb = categories.find(c => 
    (c.nameAr === 'قسم خدمات السوشيال ميديا') || 
    (c.name === 'قسم خدمات السوشيال ميديا')
  );

  console.log(`\n${categoryInDb ? '✅' : '❌'} موجود في جدول Categories: ${categoryInDb ? 'نعم' : 'لا'}`);

  mongoose.disconnect();
  console.log('\n✅ تم الانتهاء');
}).catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
