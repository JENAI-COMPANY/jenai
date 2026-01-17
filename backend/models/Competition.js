const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['achievement_based', 'random_draw', 'leaderboard'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  prizes: [{
    rank: Number,
    description: String,
    descriptionAr: String,
    value: Number,
    isPoints: Boolean
  }],
  requirements: {
    minPurchaseAmount: Number,
    minPoints: Number,
    minReferrals: Number,
    specificProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
    entryDate: {
      type: Date,
      default: Date.now
    },
    isQualified: {
      type: Boolean,
      default: false
    }
  }],
  winners: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rank: Number,
    prize: String,
    prizeAr: String,
    announcedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  autoEnroll: {
    type: Boolean,
    default: false
  },
  region: String
}, {
  timestamps: true
});

// Method to add participant
competitionSchema.methods.addParticipant = function(userId, score = 0) {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );

  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      score: score,
      isQualified: this.checkQualification(score)
    });
  }
};

// Method to check if requirements are met
competitionSchema.methods.checkQualification = function(score) {
  if (this.type === 'random_draw') {
    return true;
  }
  // Add more qualification logic based on requirements
  return score >= (this.requirements.minPoints || 0);
};

module.exports = mongoose.model('Competition', competitionSchema);
