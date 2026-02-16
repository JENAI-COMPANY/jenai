const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionAr: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'truefalse'], default: 'mcq' },
  options: [String],       // 4 خيارات للـ mcq
  correctAnswer: { type: Number, required: true } // index: 0/1/2/3 للـ mcq، 0=صح 1=خطأ
}, { _id: true });

const videoSchema = new mongoose.Schema({
  titleAr: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  descriptionAr: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  quiz: {
    questions: [questionSchema],
    passingScore: { type: Number, default: 60, min: 0, max: 100 }
  }
}, { timestamps: true });

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademyVideo', required: true },
  quizPassed: { type: Boolean, default: false },
  quizScore: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 }
}, { timestamps: true });

progressSchema.index({ user: 1, video: 1 }, { unique: true });

const AcademyVideo = mongoose.model('AcademyVideo', videoSchema);
const AcademyProgress = mongoose.model('AcademyProgress', progressSchema);

module.exports = { AcademyVideo, AcademyProgress };
