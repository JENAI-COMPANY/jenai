const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  titleAr: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  descriptionAr: String,
  author: String,
  authorAr: String,
  category: String,
  categoryAr: String,
  coverImage: String,
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'epub', 'doc'],
    default: 'pdf'
  },
  pages: Number,
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Book = mongoose.model('Book', bookSchema);

module.exports = { Book };
