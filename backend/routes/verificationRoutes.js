const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin } = require('../middleware/auth');
const uploadVerification = require('../middleware/uploadVerification');
const Verification = require('../models/Verification');
const User = require('../models/User');

// Member: submit or re-submit verification request
router.post('/submit', protect, uploadVerification.single('idImage'), async (req, res) => {
  try {
    const { idType, idNumber, fullName, dateOfBirth } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'صورة الهوية مطلوبة / ID image is required' });
    }

    if (!idType || !idNumber || !fullName || !dateOfBirth) {
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة / All fields are required' });
    }

    const idImagePath = `/uploads/verifications/${req.file.filename}`;

    // Check for existing pending or approved verification
    const existing = await Verification.findOne({ user: req.user._id });

    if (existing && existing.status === 'approved') {
      return res.status(400).json({ success: false, message: 'حسابك موثق بالفعل / Account already verified' });
    }

    if (existing && existing.status === 'pending') {
      return res.status(400).json({ success: false, message: 'طلبك قيد المراجعة / Request already pending' });
    }

    // Create new or update rejected
    if (existing && existing.status === 'rejected') {
      existing.idType = idType;
      existing.idNumber = idNumber;
      existing.fullName = fullName;
      existing.dateOfBirth = dateOfBirth;
      existing.idImage = idImagePath;
      existing.status = 'pending';
      existing.adminNote = '';
      existing.reviewedBy = null;
      existing.reviewedAt = null;
      await existing.save();
      return res.json({ success: true, message: 'تم إعادة إرسال طلب التوثيق / Verification request re-submitted', verification: existing });
    }

    const verification = await Verification.create({
      user: req.user._id,
      subscriberCode: req.user.subscriberCode || req.user.subscriberId || '',
      idType,
      idNumber,
      fullName,
      dateOfBirth,
      idImage: idImagePath,
      status: 'pending'
    });

    res.status(201).json({ success: true, message: 'تم إرسال طلب التوثيق / Verification request submitted', verification });
  } catch (err) {
    console.error('Verification submit error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Member: get my verification status
router.get('/my', protect, async (req, res) => {
  try {
    const verification = await Verification.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, verification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Super admin: get all verifications
router.get('/all', protect, isSuperAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const verifications = await Verification.find(filter)
      .populate('user', 'name username phone subscriberCode subscriberId role')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, verifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Super admin: approve verification
router.put('/:id/approve', protect, isSuperAdmin, async (req, res) => {
  try {
    const verification = await Verification.findById(req.params.id).populate('user');
    if (!verification) return res.status(404).json({ success: false, message: 'Verification not found' });

    verification.status = 'approved';
    verification.reviewedBy = req.user._id;
    verification.reviewedAt = new Date();
    verification.adminNote = '';
    await verification.save();

    // Update user's isVerified flag
    await User.findByIdAndUpdate(verification.user._id, {
      isVerified: true,
      'verificationSteps.idVerified': true
    });

    res.json({ success: true, message: 'تم قبول التوثيق / Verification approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Super admin: reject verification
router.put('/:id/reject', protect, isSuperAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;
    if (!adminNote) return res.status(400).json({ success: false, message: 'سبب الرفض مطلوب / Rejection reason required' });

    const verification = await Verification.findById(req.params.id).populate('user');
    if (!verification) return res.status(404).json({ success: false, message: 'Verification not found' });

    verification.status = 'rejected';
    verification.adminNote = adminNote;
    verification.reviewedBy = req.user._id;
    verification.reviewedAt = new Date();
    await verification.save();

    // Make sure user is NOT verified
    await User.findByIdAndUpdate(verification.user._id, {
      isVerified: false,
      'verificationSteps.idVerified': false
    });

    res.json({ success: true, message: 'تم رفض التوثيق / Verification rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
