const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

// Create complaint
exports.createComplaint = async (req, res) => {
  try {
    const { type, subject, description, relatedProduct, relatedMember, attachments } = req.body;

    const complaint = await Complaint.create({
      user: req.user.id,
      type,
      subject,
      description,
      relatedProduct,
      relatedMember,
      attachments: attachments || []
    });

    // Notify admins
    // TODO: Implement admin notification

    res.status(201).json({
      success: true,
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id })
      .populate('relatedProduct', 'name')
      .populate('relatedMember', 'name username')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      complaints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single complaint
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name username')
      .populate('relatedProduct', 'name')
      .populate('relatedMember', 'name username')
      .populate('responses.user', 'name username');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if user owns this complaint or is admin
    if (complaint.user._id.toString() !== req.user.id && !['super_admin', 'regional_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add response to complaint
exports.addResponse = async (req, res) => {
  try {
    const { message } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.responses.push({
      user: req.user.id,
      message
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update complaint status (Admin only)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, priority, assignedTo },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all complaints (Admin only)
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const complaints = await Complaint.find(query)
      .populate('user', 'name username')
      .populate('relatedProduct', 'name')
      .populate('relatedMember', 'name username')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
