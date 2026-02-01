const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Premium Coffee Beans',
    description: 'High-quality Arabica coffee beans from the finest plantations. Rich aroma and smooth taste.',
    price: 29.99,
    subscriberPrice: 24.99,
    bulkPrice: 22.99,
    bulkMinQuantity: 10,
    category: 'Food & Beverages',
    stock: 100,
    points: 30,
    bulkPoints: 40,
    commissionRate: 15,
    isActive: true,
    isNewArrival: true,
    isFeatured: true,
    isOnSale: false,
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Organic Green Tea',
    description: 'Premium organic green tea leaves. Rich in antioxidants and natural flavor.',
    price: 19.99,
    subscriberPrice: 16.99,
    bulkPrice: 14.99,
    bulkMinQuantity: 15,
    category: 'Food & Beverages',
    stock: 150,
    points: 20,
    bulkPoints: 30,
    commissionRate: 12,
    isActive: true,
    isNewArrival: false,
    isFeatured: false,
    isOnSale: true,
    saleEndDate: new Date('2026-02-28'),
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation. 30-hour battery life.',
    price: 89.99,
    subscriberPrice: 74.99,
    bulkPrice: 69.99,
    bulkMinQuantity: 5,
    category: 'Electronics',
    stock: 50,
    points: 90,
    bulkPoints: 120,
    commissionRate: 20,
    isActive: true,
    isNewArrival: true,
    isFeatured: true,
    isOnSale: false,
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Fitness Tracker Watch',
    description: 'Smart fitness tracker with heart rate monitor, sleep tracking, and waterproof design.',
    price: 59.99,
    subscriberPrice: 49.99,
    bulkPrice: 45.99,
    bulkMinQuantity: 8,
    category: 'Electronics',
    stock: 75,
    points: 60,
    bulkPoints: 80,
    commissionRate: 18,
    isActive: true,
    isNewArrival: false,
    isFeatured: true,
    isOnSale: true,
    saleEndDate: new Date('2026-01-31'),
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Luxury Skin Care Set',
    description: 'Complete skin care set with cleanser, toner, moisturizer, and serum. Natural ingredients.',
    price: 79.99,
    subscriberPrice: 64.99,
    bulkPrice: 59.99,
    bulkMinQuantity: 6,
    category: 'Beauty & Health',
    stock: 80,
    points: 80,
    bulkPoints: 100,
    commissionRate: 22,
    isActive: true,
    isNewArrival: true,
    isFeatured: false,
    isOnSale: false,
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Protein Powder (Chocolate)',
    description: 'Premium whey protein powder. 25g protein per serving. Perfect for muscle building.',
    price: 49.99,
    subscriberPrice: 42.99,
    bulkPrice: 39.99,
    bulkMinQuantity: 10,
    category: 'Health & Fitness',
    stock: 120,
    points: 50,
    bulkPoints: 70,
    commissionRate: 16,
    isActive: true,
    isNewArrival: false,
    isFeatured: true,
    isOnSale: false,
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Yoga Mat Premium',
    description: 'Extra thick yoga mat with non-slip surface. Eco-friendly material, includes carrying strap.',
    price: 39.99,
    subscriberPrice: 32.99,
    bulkPrice: 29.99,
    bulkMinQuantity: 12,
    category: 'Sports & Fitness',
    stock: 90,
    points: 40,
    bulkPoints: 55,
    commissionRate: 14,
    isActive: true,
    isNewArrival: false,
    isFeatured: false,
    isOnSale: true,
    saleEndDate: new Date('2026-01-25'),
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Smart Home LED Bulbs (4-Pack)',
    description: 'WiFi-enabled LED smart bulbs. Control with your phone. 16 million colors available.',
    price: 45.99,
    subscriberPrice: 38.99,
    bulkPrice: 35.99,
    bulkMinQuantity: 8,
    category: 'Home & Garden',
    stock: 60,
    points: 46,
    bulkPoints: 65,
    commissionRate: 15,
    isActive: true,
    isNewArrival: true,
    isFeatured: false,
    isOnSale: false,
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Insulated water bottle keeps drinks cold for 24 hours, hot for 12 hours. BPA-free.',
    price: 24.99,
    subscriberPrice: 19.99,
    bulkPrice: 17.99,
    bulkMinQuantity: 20,
    category: 'Home & Kitchen',
    stock: 200,
    points: 25,
    bulkPoints: 35,
    commissionRate: 12,
    isActive: true,
    isNewArrival: false,
    isFeatured: false,
    isOnSale: false,
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Laptop Backpack',
    description: 'Premium laptop backpack with USB charging port. Water-resistant, fits up to 17" laptop.',
    price: 54.99,
    subscriberPrice: 44.99,
    bulkPrice: 41.99,
    bulkMinQuantity: 10,
    category: 'Accessories',
    stock: 70,
    points: 55,
    bulkPoints: 75,
    commissionRate: 17,
    isActive: true,
    isNewArrival: false,
    isFeatured: true,
    isOnSale: false,
    region: 'main',
    allowCustomOrder: false
  },
  {
    name: 'Custom Gift Box',
    description: 'Personalized gift box with your choice of items. Perfect for special occasions.',
    price: 99.99,
    subscriberPrice: 84.99,
    category: 'Gifts',
    stock: 0,
    points: 100,
    commissionRate: 20,
    isActive: true,
    isNewArrival: false,
    isFeatured: false,
    isOnSale: false,
    region: 'main',
    allowCustomOrder: true,
    customOrderDeposit: 30.00,
    estimatedDeliveryDays: 14
  },
  {
    name: 'Essential Oils Set (6-Pack)',
    description: 'Pure essential oils set. Includes lavender, peppermint, eucalyptus, tea tree, lemon, and orange.',
    price: 34.99,
    subscriberPrice: 28.99,
    bulkPrice: 25.99,
    bulkMinQuantity: 12,
    category: 'Beauty & Health',
    stock: 5,
    points: 35,
    bulkPoints: 50,
    commissionRate: 18,
    isActive: true,
    isNewArrival: true,
    isFeatured: false,
    isOnSale: false,
    region: 'main',
    allowCustomOrder: false
  }
];

const addProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/network-marketing');
    console.log('MongoDB Connected');

    // Clear existing products (optional - comment out if you want to keep existing products)
    // await Product.deleteMany({});
    // console.log('Cleared existing products');

    // Add sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`\n✓ Successfully added ${products.length} products!\n`);

    // Display added products
    console.log('Products added:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   - Price: $${product.price} (Subscriber: $${product.subscriberPrice})`);
      console.log(`   - Stock: ${product.stock}`);
      console.log(`   - Category: ${product.category}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

addProducts();
