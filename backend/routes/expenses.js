const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/expenses
// @desc    Create expense
// @access  Private
router.post('/', [
  auth,
  body('category').notEmpty().trim(),
  body('amount').isFloat({ min: 0 }),
  body('description').notEmpty().trim(),
  body('expenseDate').notEmpty(),
  body('receiptUrl').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.create({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses
// @desc    Get all expenses
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 1000
    });
    
    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ 
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', [
  auth,
  body('category').optional().notEmpty().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('description').optional().notEmpty().trim(),
  body('expenseDate').optional().notEmpty(),
  body('receiptUrl').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = {};
    const allowedFields = ['category', 'amount', 'description', 'expenseDate', 'receiptUrl'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const [updateCount] = await Expense.update(updateData, {
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (updateCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = await Expense.findByPk(req.params.id);
    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleteCount = await Expense.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (deleteCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
