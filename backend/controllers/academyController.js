const { AcademyVideo, AcademyProgress } = require('../models/Academy');
const path = require('path');
const fs = require('fs');

// GET /api/academy/videos - جلب كل الفيديوهات مرتبة
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await AcademyVideo.find({ isActive: true }).sort('order');
    res.status(200).json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/academy/videos/all - للسوبر ادمن (يشمل غير الفعال)
exports.getAllVideosAdmin = async (req, res) => {
  try {
    const videos = await AcademyVideo.find().sort('order');
    res.status(200).json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/academy/progress - تقدم العضو الحالي
exports.getMyProgress = async (req, res) => {
  try {
    const progress = await AcademyProgress.find({ user: req.user.id });
    res.status(200).json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/academy/videos/:id/quiz - تسليم إجابات الامتحان
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // مصفوفة أرقام: [0, 1, 2, ...]
    const video = await AcademyVideo.findById(req.params.id);

    if (!video) return res.status(404).json({ message: 'الفيديو غير موجود' });

    const questions = video.quiz.questions;
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'لا يوجد امتحان لهذا الفيديو' });
    }

    // حساب الدرجة
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] !== undefined && Number(answers[i]) === q.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= video.quiz.passingScore;

    // حفظ أو تحديث التقدم
    let progress = await AcademyProgress.findOne({ user: req.user.id, video: video._id });
    if (!progress) {
      progress = await AcademyProgress.create({
        user: req.user.id,
        video: video._id,
        quizPassed: passed,
        quizScore: score,
        attempts: 1
      });
    } else {
      progress.attempts += 1;
      progress.quizScore = score;
      if (passed) progress.quizPassed = true;
      await progress.save();
    }

    res.status(200).json({
      success: true,
      score,
      passed,
      passingScore: video.quiz.passingScore,
      correct,
      total: questions.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/academy/videos - إنشاء فيديو جديد (super_admin)
exports.createVideo = async (req, res) => {
  try {
    const video = await AcademyVideo.create(req.body);
    res.status(201).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/academy/videos/:id - تعديل فيديو (super_admin)
exports.updateVideo = async (req, res) => {
  try {
    const video = await AcademyVideo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!video) return res.status(404).json({ message: 'الفيديو غير موجود' });
    res.status(200).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/academy/videos/:id - حذف فيديو (super_admin)
exports.deleteVideo = async (req, res) => {
  try {
    const video = await AcademyVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ message: 'الفيديو غير موجود' });

    // حذف ملف الفيديو إن وجد
    if (video.videoUrl && video.videoUrl.startsWith('/uploads/academy/')) {
      const filePath = path.join(__dirname, '..', video.videoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // حذف تقدم الأعضاء المرتبط
    await AcademyProgress.deleteMany({ video: video._id });

    res.status(200).json({ success: true, message: 'تم حذف الفيديو' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/academy/videos/:id/upload - رفع ملف فيديو (super_admin)
exports.uploadVideoFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'لم يتم رفع أي ملف' });

    const video = await AcademyVideo.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'الفيديو غير موجود' });

    // حذف الملف القديم إن وجد
    if (video.videoUrl && video.videoUrl.startsWith('/uploads/academy/')) {
      const oldPath = path.join(__dirname, '..', video.videoUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const videoUrl = `/uploads/academy/${req.file.filename}`;
    video.videoUrl = videoUrl;
    await video.save();

    res.status(200).json({ success: true, videoUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
