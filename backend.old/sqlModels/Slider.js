const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Slider = sequelize.define('Slider', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide an image' }
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: '`order`' // Escape reserved keyword
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sliders',
  timestamps: true,
  indexes: [
    { fields: ['isActive'] },
    { fields: ['order'] }
  ]
});

module.exports = Slider;
