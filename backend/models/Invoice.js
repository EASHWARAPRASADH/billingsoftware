const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Invoice = sequelize.define('Invoice', {
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
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  client_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  client_email: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  client_phone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  client_address: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  amount_received: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: { min: 0 }
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue'),
    defaultValue: 'draft'
  },
  invoice_date: {
    type: DataTypes.STRING,
    allowNull: false
  },
  due_date: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  terms: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'invoices',
  hooks: {
    beforeCreate: async (invoice) => {
      if (!invoice.invoice_number) {
        const count = await Invoice.count({ where: { user_id: invoice.user_id } });
        invoice.invoice_number = `INV-${String(count + 1).padStart(5, '0')}`;
      }
    }
  }
});

Invoice.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Invoice, { foreignKey: 'user_id' });

module.exports = Invoice;
