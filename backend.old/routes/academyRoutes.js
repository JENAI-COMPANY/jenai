const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getAllCourses,
  getCourse,
  getMyProgress,
  updateProgress,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/academyController');

// Public routes
router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourse);

// User routes
router.get('/my-progress', protect, getMyProgress);
router.post('/courses/:courseId/progress', protect, updateProgress);

// Admin routes
router.post('/courses', protect, isAdmin, createCourse);
router.put('/courses/:id', protect, isAdmin, updateCourse);
router.delete('/courses/:id', protect, isAdmin, deleteCourse);

module.exports = router;
