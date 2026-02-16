const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, isSuperAdmin } = require('../middleware/auth');
const {
  getAllVideos,
  getAllVideosAdmin,
  getMyProgress,
  submitQuiz,
  createVideo,
  updateVideo,
  deleteVideo,
  uploadVideoFile
} = require('../controllers/academyController');

// إعداد multer لرفع ملفات الفيديو
const uploadDir = path.join(__dirname, '../uploads/academy');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|webm|ogg|mov|avi|mkv/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بملفات الفيديو'));
    }
  }
});

// Member routes (يحتاج تسجيل دخول)
router.get('/videos', protect, getAllVideos);
router.get('/progress', protect, getMyProgress);
router.post('/videos/:id/quiz', protect, submitQuiz);

// Admin routes (super_admin فقط)
router.get('/videos/all', protect, isSuperAdmin, getAllVideosAdmin);
router.post('/videos', protect, isSuperAdmin, createVideo);
router.put('/videos/:id', protect, isSuperAdmin, updateVideo);
router.delete('/videos/:id', protect, isSuperAdmin, deleteVideo);
router.post('/videos/:id/upload', protect, isSuperAdmin, upload.single('video'), uploadVideoFile);

module.exports = router;
