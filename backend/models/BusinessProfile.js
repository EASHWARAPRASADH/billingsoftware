const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const BusinessProfile = sequelize.define('BusinessProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'user_id'
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_email: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  company_phone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  company_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_logo: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  gst_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pan_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ifsc_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  signature_image: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  tax_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'business_profiles'
});

BusinessProfile.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(BusinessProfile, { foreignKey: 'user_id' });

module.exports = BusinessProfile;
