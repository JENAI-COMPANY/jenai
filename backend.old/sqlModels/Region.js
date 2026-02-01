const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Region = sequelize.define('Region', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Please provide region name' }
    }
  },
  nameAr: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide Arabic region name' }
    }
  },
  nameEn: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide English region name' }
    }
  },
  code: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Please provide region code' },
      len: [1, 3]
    },
    set(value) {
      this.setDataValue('code', value.toUpperCase().trim());
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  regionalAdminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Settings as JSON
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      currency: 'ILS',
      taxRate: 0,
      shippingCost: 0,
      minOrderAmount: 0
    }
  },
  // Contact Info as JSON
  contactInfo: {
    type: DataTypes.JSON,
    defaultValue: {
      phone: null,
      email: null,
      address: {
        street: null,
        city: null,
        zipCode: null
      }
    }
  },
  totalMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Stats as JSON
  stats: {
    type: DataTypes.JSON,
    defaultValue: {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0
    }
  }
}, {
  tableName: 'regions',
  timestamps: true,
  indexes: [
    {
      fields: ['isActive']
    },
    {
      fields: ['code']
    }
  ]
});

module.exports = Region;
