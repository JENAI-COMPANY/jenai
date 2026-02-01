const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  orderItems: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false
  },
  contactPhone: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  alternatePhone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash_on_delivery', 'cash_at_company', 'reflect'),
    allowNull: false
  },
  paymentResult: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  itemsPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0
  },
  taxPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0
  },
  shippingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0
  },
  couponCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isCancelled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'prepared', 'on_the_way', 'received', 'cancelled'),
    defaultValue: 'pending'
  },
  tracking: {
    type: DataTypes.JSON,
    defaultValue: {
      trackingNumber: null,
      carrier: null,
      estimatedDelivery: null,
      history: []
    }
  },
  isCustomOrder: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  customOrderDetails: {
    type: DataTypes.JSON,
    defaultValue: {
      specifications: null,
      depositAmount: null,
      remainingAmount: null,
      requestedDeliveryDate: null,
      additionalNotes: null,
      adminResponse: null,
      confirmedPrice: null,
      isConfirmed: false
    }
  },
  commissions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  isFirstOrder: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  referredById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    { fields: ['orderNumber'] },
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['isPaid'] },
    { fields: ['isDelivered'] }
  ],
  hooks: {
    beforeCreate: async (order) => {
      if (!order.orderNumber) {
        const count = await Order.count();
        order.orderNumber = `ORD${Date.now()}${count + 1}`;
      }
    }
  }
});

module.exports = Order;
