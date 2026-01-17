const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/network-marketing');

const categorySchema = new mongoose.Schema({
  name: String,
  isActive: Boolean
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  category: String
});

const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

async function importCategories() {
  try {
    console.log('Starting category import...');

    // Get all unique categories from products
    const products = await Product.find({}, 'category');
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(c => c && c.trim()))];

    console.log(`Found ${uniqueCategories.length} unique categories from products:`, uniqueCategories);

    // Get existing categories
    const existingCategories = await Category.find({});
    const existingNames = existingCategories.map(c => c.name);

    console.log(`Existing categories in database: ${existingNames.length}`);

    // Add new categories
    let addedCount = 0;
    for (const categoryName of uniqueCategories) {
      if (!existingNames.includes(categoryName)) {
        await Category.create({
          name: categoryName,
          isActive: true
        });
        console.log(`✓ Added category: ${categoryName}`);
        addedCount++;
      } else {
        console.log(`- Category already exists: ${categoryName}`);
      }
    }

    console.log(`\nImport complete! Added ${addedCount} new categories.`);

    // Show all categories
    const allCategories = await Category.find({ isActive: true }).sort({ name: 1 });
    console.log('\nAll active categories:');
    allCategories.forEach(cat => console.log(`  - ${cat.name}`));

    process.exit(0);
  } catch (error) {
    console.error('Error importing categories:', error);
    process.exit(1);
  }
}

importCategories();
