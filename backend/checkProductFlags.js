require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');

  const newArrivals = await Product.countDocuments({ isNewArrival: true });
  const offers = await Product.countDocuments({ isOffer: true });
  const total = await Product.countDocuments({});

  console.log('\n📊 Product Filter Statistics:');
  console.log('============================');
  console.log('Products with isNewArrival=true:', newArrivals);
  console.log('Products with isOffer=true:', offers);
  console.log('Total products:', total);
  console.log('============================\n');

  if (newArrivals === 0) {
    console.log('⚠️  No products marked as "New Arrivals". You need to set isNewArrival=true on some products.');
  }

  if (offers === 0) {
    console.log('⚠️  No products marked as "Offers". You need to set isOffer=true on some products.');
  }

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
