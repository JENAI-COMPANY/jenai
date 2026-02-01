const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/network-marketing', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const sliderSchema = new mongoose.Schema({
  image: String,
  alt: String,
  order: Number,
  isActive: Boolean
}, { timestamps: true });

const Slider = mongoose.model('Slider', sliderSchema);

const defaultSliders = [
  {
    image: '/images/slider1.jpg',
    alt: 'Natural skincare products',
    order: 0,
    isActive: true
  },
  {
    image: '/images/slider2.jpg',
    alt: 'Jenai skincare banner',
    order: 1,
    isActive: true
  },
  {
    image: '/images/slider3.jpg',
    alt: 'Premium skincare collection',
    order: 2,
    isActive: true
  }
];

async function importSliders() {
  try {
    // Check if sliders already exist
    const existingSliders = await Slider.find();

    if (existingSliders.length > 0) {
      console.log('Sliders already exist in database. Skipping import.');
      process.exit(0);
    }

    // Copy images from frontend/public/images to backend/uploads
    const frontendImagesPath = path.join(__dirname, '../../frontend/public/images');
    const backendUploadsPath = path.join(__dirname, '../uploads');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(backendUploadsPath)) {
      fs.mkdirSync(backendUploadsPath, { recursive: true });
    }

    const slidersToImport = [];

    for (let i = 1; i <= 3; i++) {
      const sourceFile = path.join(frontendImagesPath, `slider${i}.jpg`);
      const destFile = path.join(backendUploadsPath, `slider${i}.jpg`);

      if (fs.existsSync(sourceFile)) {
        // Copy file to backend uploads
        fs.copyFileSync(sourceFile, destFile);
        console.log(`Copied slider${i}.jpg to uploads folder`);

        slidersToImport.push({
          image: `/uploads/slider${i}.jpg`,
          alt: defaultSliders[i - 1].alt,
          order: i - 1,
          isActive: true
        });
      }
    }

    // Insert sliders into database
    if (slidersToImport.length > 0) {
      await Slider.insertMany(slidersToImport);
      console.log(`Successfully imported ${slidersToImport.length} sliders to database`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error importing sliders:', error);
    process.exit(1);
  }
}

importSliders();
