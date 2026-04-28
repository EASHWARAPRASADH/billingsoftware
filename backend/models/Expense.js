const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    field: 'user_id'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expense_date: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receipt_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'expenses'
});

Expense.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Expense, { foreignKey: 'user_id' });

module.exports = Expense;
