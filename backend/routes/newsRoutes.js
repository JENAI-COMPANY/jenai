const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { protect, optionalAuth } = require('../middleware/auth');

// GET news - super_admin sees all, public sees only active
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    // الأدمن يرى جميع الأخبار (منشورة وغير منشورة)
    const isSuperAdmin = req.user && req.user.role === 'super_admin';
    const query = isSuperAdmin ? {} : { isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { titleAr: { $regex: search, $options: 'i' } },
        { contentAr: { $regex: search, $options: 'i' } }
      ];
    }

    const news = await News.find(query).sort({ isPinned: -1, createdAt: -1 });
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create news (super_admin only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }
    const news = await News.create(req.body);
    res.status(201).json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update news (super_admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!news) return res.status(404).json({ success: false, message: 'الخبر غير موجود' });
    res.json({ success: true, news });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE news (super_admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }
    await News.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف الخبر' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
