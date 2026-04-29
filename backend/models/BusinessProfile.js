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
    }
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 100
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  logo: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Base64 encoded company logo'
  },
  signature: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Base64 encoded CEO signature'
  }
}, {
  timestamps: true
});

// Relationships
BusinessProfile.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(BusinessProfile, { foreignKey: 'userId' });

module.exports = BusinessProfile;
