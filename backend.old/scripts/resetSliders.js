const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/network-marketing');

const sliderSchema = new mongoose.Schema({
  image: String,
  alt: String,
  order: Number,
  isActive: Boolean
}, { timestamps: true });

const Slider = mongoose.model('Slider', sliderSchema);

async function resetSliders() {
  try {
    // Delete all existing sliders
    await Slider.deleteMany({});
    console.log('Deleted all existing sliders');

    // Copy images from frontend/public/images to backend/uploads
    const frontendImagesPath = path.join(__dirname, '../../frontend/public/images');
    const backendUploadsPath = path.join(__dirname, '../uploads');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(backendUploadsPath)) {
      fs.mkdirSync(backendUploadsPath, { recursive: true });
    }

    const slidersToImport = [
      { alt: 'Natural skincare products', order: 0 },
      { alt: 'Jenai skincare banner', order: 1 },
      { alt: 'Premium skincare collection', order: 2 }
    ];

    const imported = [];

    for (let i = 1; i <= 3; i++) {
      const sourceFile = path.join(frontendImagesPath, `slider${i}.jpg`);
      const destFile = path.join(backendUploadsPath, `slider${i}.jpg`);

      if (fs.existsSync(sourceFile)) {
        // Copy file to backend uploads
        fs.copyFileSync(sourceFile, destFile);
        console.log(`Copied slider${i}.jpg to uploads folder`);

        imported.push({
          image: `/uploads/slider${i}.jpg`,
          alt: slidersToImport[i - 1].alt,
          order: slidersToImport[i - 1].order,
          isActive: true
        });
      } else {
        console.log(`Warning: slider${i}.jpg not found in ${frontendImagesPath}`);
      }
    }

    // Insert sliders into database
    if (imported.length > 0) {
      await Slider.insertMany(imported);
      console.log(`Successfully imported ${imported.length} sliders to database`);
    } else {
      console.log('No slider images found to import');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error resetting sliders:', error);
    process.exit(1);
  }
}

resetSliders();
