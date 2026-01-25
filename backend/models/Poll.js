const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  textAr: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  },
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please provide poll question'],
    trim: true
  },
  questionAr: {
    type: String,
    required: [true, 'Please provide Arabic poll question'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  descriptionAr: {
    type: String,
    trim: true
  },
  options: [pollOptionSchema],

  // من أنشأ الاستفتاء
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // نطاق الاستفتاء
  scope: {
    type: String,
    enum: ['all', 'region'],
    default: 'all'
  },

  // المنطقة المستهدفة (إذا كان scope = region)
  targetRegion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region'
  },

  // الحالة
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'archived'],
    default: 'active'
  },

  // خيارات الاستفتاء
  settings: {
    allowMultipleVotes: {
      type: Boolean,
      default: false
    },
    showResultsBeforeVoting: {
      type: Boolean,
      default: false
    },
    showResultsAfterVoting: {
      type: Boolean,
      default: true
    },
    anonymousVoting: {
      type: Boolean,
      default: false
    }
  },

  // تواريخ
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },

  // إحصائيات
  totalVotes: {
    type: Number,
    default: 0
  },
  totalVoters: {
    type: Number,
    default: 0
  },

  // المصوتون
  voters: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    },
    selectedOptions: [{
      type: mongoose.Schema.Types.ObjectId
    }]
  }],

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index للبحث السريع
pollSchema.index({ status: 1, isActive: 1 });
pollSchema.index({ createdBy: 1 });
pollSchema.index({ targetRegion: 1 });
pollSchema.index({ endDate: 1 });

// Method لحساب النسب المئوية
pollSchema.methods.calculatePercentages = function() {
  const results = this.options.map(option => {
    const percentage = this.totalVotes > 0
      ? ((option.votes / this.totalVotes) * 100).toFixed(2)
      : 0;

    return {
      _id: option._id,
      text: option.text,
      textAr: option.textAr,
      votes: option.votes,
      percentage: parseFloat(percentage)
    };
  });

  return results;
};

// Method للتحقق من انتهاء الاستفتاء
pollSchema.methods.isExpired = function() {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
};

// Method للتحقق من صلاحية التصويت
pollSchema.methods.canVote = function() {
  if (!this.isActive) return false;
  if (this.status !== 'active') return false;
  if (this.isExpired()) return false;
  return true;
};

// Method للتحقق من تصويت المستخدم
pollSchema.methods.hasUserVoted = function(userId) {
  return this.voters.some(voter => voter.user.toString() === userId.toString());
};

module.exports = mongoose.model('Poll', pollSchema);
