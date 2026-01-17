const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  createComplaint,
  getMyComplaints,
  getComplaint,
  addResponse,
  updateComplaintStatus,
  getAllComplaints
} = require('../controllers/complaintController');

// User routes
router.post('/', protect, createComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/:id', protect, getComplaint);
router.post('/:id/response', protect, addResponse);

// Admin routes
router.get('/', protect, isAdmin, getAllComplaints);
router.put('/:id/status', protect, isAdmin, updateComplaintStatus);

module.exports = router;
