const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getCategories,
  addCategory,
  deleteCategory,
  getAllCategories,
  updateCategory
} = require('../controllers/categoryController');
const { protect, isSuperAdmin } = require('../middleware/auth');

// Create uploads/categories directory if it doesn't exist
const categoriesDir = path.join(__dirname, '..', 'uploads', 'categories');
if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
}

// Configure multer for category image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, categoriesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Public route - get active categories
router.get('/', getCategories);

// Admin routes
router.get('/all', protect, isSuperAdmin, getAllCategories);
router.post('/', protect, isSuperAdmin, upload.single('image'), addCategory);
router.put('/:id', protect, isSuperAdmin, upload.single('image'), updateCategory);
router.delete('/:name', protect, isSuperAdmin, deleteCategory);

module.exports = router;
