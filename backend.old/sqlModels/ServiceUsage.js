const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ServiceUsage = sequelize.define('ServiceUsage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  guestName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  guestPhone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  invoiceAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  invoiceNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  invoiceDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  receiptImage: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  invoiceImages: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  pointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reviewedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'service_usages',
  timestamps: true,
  indexes: [
    { fields: ['serviceId'] },
    { fields: ['userId'] },
    { fields: ['status'] }
  ]
});

module.exports = ServiceUsage;
