const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'Slider image'
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Slider', sliderSchema);
