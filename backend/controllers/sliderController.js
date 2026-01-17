const Slider = require('../models/Slider');
const fs = require('fs');
const path = require('path');

// Get all active slider images
exports.getSliders = async (req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ order: 1 });
    res.json({ sliders });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all sliders (admin only)
exports.getAllSliders = async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ order: 1 });
    res.json({ sliders });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new slider image
exports.createSlider = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const { alt, order } = req.body;

    const slider = new Slider({
      image: `/uploads/${req.file.filename}`,
      alt: alt || 'Slider image',
      order: order || 0
    });

    await slider.save();
    res.status(201).json({ message: 'Slider image created successfully', slider });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update slider image
exports.updateSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const { alt, order, isActive } = req.body;

    const slider = await Slider.findById(id);
    if (!slider) {
      return res.status(404).json({ message: 'Slider not found' });
    }

    // Update fields
    if (alt !== undefined) slider.alt = alt;
    if (order !== undefined) slider.order = order;
    if (isActive !== undefined) slider.isActive = isActive;

    // Update image if new file uploaded
    if (req.file) {
      // Delete old image file
      const oldImagePath = path.join(__dirname, '..', slider.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      slider.image = `/uploads/${req.file.filename}`;
    }

    await slider.save();
    res.json({ message: 'Slider updated successfully', slider });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete slider image
exports.deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;

    const slider = await Slider.findById(id);
    if (!slider) {
      return res.status(404).json({ message: 'Slider not found' });
    }

    // Delete image file
    const imagePath = path.join(__dirname, '..', slider.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Slider.findByIdAndDelete(id);
    res.json({ message: 'Slider deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
