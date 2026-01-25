const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a product name' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a product description' }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  customerPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a customer price' },
      min: 0
    }
  },
  subscriberPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a subscriber price' },
      min: 0
    }
  },
  bulkPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  bulkMinQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: {
      min: 1
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a category' }
    }
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  media: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  soldCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10,
    validate: {
      min: 0,
      max: 100
    }
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  bulkPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isNewArrival: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isOnSale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  saleEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvalStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  regionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'regions',
      key: 'id'
    }
  },
  regionalPricing: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isGlobal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  memberPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  wholesalePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  hasDiscount: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  customerDiscount: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: false,
      originalPrice: 0,
      discountedPrice: 0,
      discountPercentage: 0
    }
  },
  subscriberDiscount: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: false,
      originalPrice: 0,
      discountedPrice: 0,
      discountPercentage: 0
    }
  },
  isOutOfStock: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allowCustomOrder: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  customOrderDeposit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  estimatedDeliveryDays: {
    type: DataTypes.INTEGER,
    defaultValue: 7
  },
  reviews: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  averageRating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['isActive'] },
    { fields: ['regionId'] },
    { fields: ['supplierId'] },
    { fields: ['isGlobal'] },
    { fields: ['sku'] }
  ]
});

// Instance methods
Product.prototype.calculateAverageRating = function() {
  if (!this.reviews || this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const approvedReviews = this.reviews.filter(review => review.isApproved);
    if (approvedReviews.length === 0) {
      this.averageRating = 0;
      this.totalReviews = 0;
    } else {
      const sum = approvedReviews.reduce((acc, review) => acc + review.rating, 0);
      this.averageRating = (sum / approvedReviews.length).toFixed(1);
      this.totalReviews = approvedReviews.length;
    }
  }
};

module.exports = Product;
