const { Course, CourseProgress } = require('../models/Academy');

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const { category, level } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (level) query.level = level;

    const courses = await Course.find(query).sort('order');

    res.status(200).json({
      success: true,
      courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single course
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's progress
exports.getMyProgress = async (req, res) => {
  try {
    const progress = await CourseProgress.find({ user: req.user.id })
      .populate('course', 'title titleAr thumbnail points');

    res.status(200).json({
      success: true,
      progress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update course progress
exports.updateProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { watchedPercentage, quizScore, isCompleted } = req.body;

    let progress = await CourseProgress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user.id,
        course: courseId,
        watchedPercentage: watchedPercentage || 0
      });
    } else {
      progress.watchedPercentage = watchedPercentage || progress.watchedPercentage;
      if (quizScore !== undefined) progress.quizScore = quizScore;
      if (isCompleted) {
        progress.isCompleted = true;
        progress.completionDate = new Date();

        // Award points
        const course = await Course.findById(courseId);
        if (course && course.points > 0) {
          const User = require('../models/User');
          await User.findByIdAndUpdate(req.user.id, {
            $inc: { points: course.points }
          });
          progress.pointsEarned = course.points;
        }
      }
      await progress.save();
    }

    res.status(200).json({
      success: true,
      progress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Create course
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update course
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
