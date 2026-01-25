const { sequelize } = require('../config/sequelize');
const Region = require('./Region');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const ServiceUsage = require('./ServiceUsage');
const ProfitPeriod = require('./ProfitPeriod');
const Slider = require('./Slider');

// Define relationships

// Region <-> User (One to Many)
Region.hasMany(User, { foreignKey: 'regionId', as: 'members' });
User.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

// Region <-> User (Regional Admin) (One to One)
Region.belongsTo(User, { foreignKey: 'regionalAdminId', as: 'regionalAdmin' });

// User self-referential relationships
// Sponsor relationship
User.belongsTo(User, { foreignKey: 'sponsorId', as: 'sponsor' });
User.hasMany(User, { foreignKey: 'sponsorId', as: 'downline' });

// Referred By relationship
User.belongsTo(User, { foreignKey: 'referredById', as: 'referrer' });
User.hasMany(User, { foreignKey: 'referredById', as: 'referrals' });

// Supplier relationship
User.belongsTo(User, { foreignKey: 'supplierId', as: 'supplierRef' });
User.hasMany(User, { foreignKey: 'supplierId', as: 'suppliedUsers' });

// Product <-> User (Supplier)
Product.belongsTo(User, { foreignKey: 'supplierId', as: 'supplier' });
User.hasMany(Product, { foreignKey: 'supplierId', as: 'suppliedProducts' });

// Product <-> User (Approved By)
Product.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

// Product <-> Region
Product.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
Region.hasMany(Product, { foreignKey: 'regionId', as: 'products' });

// Order <-> User
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

// Order <-> User (Cancelled By)
Order.belongsTo(User, { foreignKey: 'cancelledById', as: 'cancelledBy' });

// Order <-> User (Referred By)
Order.belongsTo(User, { foreignKey: 'referredById', as: 'referredBy' });

// ServiceUsage <-> User
ServiceUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ServiceUsage, { foreignKey: 'userId', as: 'serviceUsages' });

// ServiceUsage <-> User (Reviewed By)
ServiceUsage.belongsTo(User, { foreignKey: 'reviewedById', as: 'reviewedBy' });

// ProfitPeriod <-> User (Calculated By)
ProfitPeriod.belongsTo(User, { foreignKey: 'calculatedById', as: 'calculatedBy' });

// Sync database
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Region,
  User,
  Product,
  Order,
  ServiceUsage,
  ProfitPeriod,
  Slider,
  syncDatabase
};
