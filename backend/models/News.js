const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  titleAr: {
    type: String,
    required: true,
    trim: true
  },
  titleEn: {
    type: String,
    trim: true
  },
  contentAr: {
    type: String,
    required: true
  },
  contentEn: {
    type: String
  },
  image: {
    type: String
  },
  category: {
    type: String,
    default: 'عام'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  author: {
    type: String,
    default: 'فريق جيناي'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const News = mongoose.model('News', newsSchema);
module.exports = News;
