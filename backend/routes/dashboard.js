const express = require('express');
const { Op } = require('sequelize');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.findAll({ where: { user_id: req.user.id } });
    const expenses = await Expense.findAll({ where: { user_id: req.user.id } });
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    
    const pendingInvoices = invoices.filter(inv => 
      ['draft', 'sent'].includes(inv.status)
    ).length;
    
    const paidInvoices = invoices.filter(inv => 
      inv.status === 'paid'
    ).length;
    
    const recentInvoices = await Invoice.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    const recentExpenses = await Expense.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    res.json({
      totalRevenue,
      totalExpenses,
      pendingInvoices,
      paidInvoices,
      recentInvoices,
      recentExpenses
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
