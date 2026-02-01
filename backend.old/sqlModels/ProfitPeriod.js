const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ProfitPeriod = sequelize.define('ProfitPeriod', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  periodName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  periodNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'finalized', 'paid'),
    defaultValue: 'finalized'
  },
  calculatedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  calculatedByName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  calculatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  membersProfits: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  summary: {
    type: DataTypes.JSON,
    defaultValue: {
      totalMembers: 0,
      totalPerformanceProfits: 0,
      totalLeadershipProfits: 0,
      totalProfits: 0,
      averageProfit: 0
    }
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
}, {
  tableName: 'profit_periods',
  timestamps: true,
  indexes: [
    { fields: ['periodNumber'], order: [['periodNumber', 'DESC']] },
    { fields: ['createdAt'], order: [['createdAt', 'DESC']] }
  ]
});

// Static method to check if a period is available
ProfitPeriod.checkPeriodAvailable = async function(startDate, endDate) {
  const overlappingPeriod = await ProfitPeriod.findOne({
    where: {
      [Op.or]: [
        // New period starts during an existing period
        {
          startDate: { [Op.lte]: startDate },
          endDate: { [Op.gte]: startDate }
        },
        // New period ends during an existing period
        {
          startDate: { [Op.lte]: endDate },
          endDate: { [Op.gte]: endDate }
        },
        // New period completely contains an existing period
        {
          startDate: { [Op.gte]: startDate },
          endDate: { [Op.lte]: endDate }
        }
      ]
    }
  });

  return !overlappingPeriod; // Returns true if available (no overlap)
};

module.exports = ProfitPeriod;
