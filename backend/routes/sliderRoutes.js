const express = require('express');
const router = express.Router();
const {
  getSliders,
  getAllSliders,
  createSlider,
  updateSlider,
  deleteSlider
} = require('../controllers/sliderController');
const { protect, isSuperAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route - get active sliders
router.get('/', getSliders);

// Admin routes - require super admin authentication
router.get('/all', protect, isSuperAdmin, getAllSliders);
router.post('/', protect, isSuperAdmin, upload.single('image'), createSlider);
router.put('/:id', protect, isSuperAdmin, upload.single('image'), updateSlider);
router.delete('/:id', protect, isSuperAdmin, deleteSlider);

module.exports = router;
