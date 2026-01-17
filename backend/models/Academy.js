const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  titleAr: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  descriptionAr: String,
  category: String,
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  videoUrl: {
    type: String,
    required: true
  },
  duration: Number, // in minutes
  thumbnail: String,
  order: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    default: 0
  },
  quiz: [{
    question: String,
    questionAr: String,
    options: [String],
    optionsAr: [String],
    correctAnswer: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completionDate: Date,
  quizScore: {
    type: Number,
    min: 0,
    max: 100
  },
  watchedPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  pointsEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure one progress record per user per course
progressSchema.index({ user: 1, course: 1 }, { unique: true });

const Course = mongoose.model('Course', courseSchema);
const CourseProgress = mongoose.model('CourseProgress', progressSchema);

module.exports = { Course, CourseProgress };
