const mongoose = require('mongoose');

const memberSnapshotSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberName: String,
  username: String,
  subscriberCode: String,
  points: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  bonusPoints: { type: Number, default: 0 },
  compensationPoints: { type: Number, default: 0 },
  generation1Points: { type: Number, default: 0 },
  generation2Points: { type: Number, default: 0 },
  generation3Points: { type: Number, default: 0 },
  generation4Points: { type: Number, default: 0 },
  generation5Points: { type: Number, default: 0 },
  profitPoints: { type: Number, default: 0 }
}, { _id: false });

const pointsSnapshotSchema = new mongoose.Schema({
  profitPeriodId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfitPeriod', required: true },
  periodName: String,
  periodNumber: Number,
  takenAt: { type: Date, default: Date.now },
  takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  takenByName: String,
  members: [memberSnapshotSchema]
});

module.exports = mongoose.model('PointsSnapshot', pointsSnapshotSchema);
