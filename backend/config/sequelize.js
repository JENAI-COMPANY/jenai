const { Sequelize } = require('sequelize');
require('dotenv').config();

// إنشاء اتصال Sequelize بـ MariaDB
const sequelize = new Sequelize(
  process.env.DB_NAME || 'jenai4uc_',
  process.env.DB_USER || 'jenai4uc_',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    dialectOptions: {
      timezone: 'Etc/GMT+0',
      connectTimeout: 60000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

// اختبار الاتصال
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MariaDB Connected:', process.env.DB_HOST || 'localhost');
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to MariaDB:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
