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
const uploadSlider = require('../middleware/uploadSlider');

// Public route - get active sliders
router.get('/', getSliders);

// Admin routes - require super admin authentication
router.get('/all', protect, isSuperAdmin, getAllSliders);
router.post('/', protect, isSuperAdmin, uploadSlider.single('image'), createSlider);
router.put('/:id', protect, isSuperAdmin, uploadSlider.single('image'), updateSlider);
router.delete('/:id', protect, isSuperAdmin, deleteSlider);

module.exports = router;
