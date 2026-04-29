const express = require('express');
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/invoices
// @desc    Create invoice
// @access  Private
router.post('/check-duplicate', [
  auth,
  body('clientName').notEmpty().trim(),
  body('issueDate').notEmpty(),
  body('total').isFloat()
], async (req, res) => {
  try {
    const { clientName, issueDate, total } = req.body;

    // Check for existing invoice with same client, date, and total
    const duplicate = await Invoice.findOne({
      where: {
        userId: req.user.id,
        clientName: clientName,
        issueDate: issueDate,
        total: total
      }
    });

    if (duplicate) {
      return res.json({
        exists: true,
        invoiceId: duplicate.id,
        invoiceNumber: duplicate.invoiceNumber
      });
    }

    res.json({ exists: false });
  } catch (error) {
    console.error('Check duplicate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/invoices
// @desc    Create invoice
// @access  Private
router.post('/', [
  auth,
  body('clientName').notEmpty().trim(),
  body('clientEmail').optional().isEmail().normalizeEmail(),
  body('clientAddress').optional().trim(),
  body('invoiceNumber').optional().trim(),
  body('items').isArray({ min: 1 }),
  body('items.*.description').notEmpty().trim(),
  body('items.*.quantity').isFloat({ min: 0 }),
  body('items.*.rate').isFloat({ min: 0 }),
  body('items.*.amount').isFloat({ min: 0 }),
  body('subtotal').isFloat({ min: 0 }),
  body('tax').isFloat({ min: 0 }),
  body('shippingCost').optional().isFloat({ min: 0 }),
  body('couponDiscount').optional().isFloat({ min: 0 }),
  body('total').isFloat({ min: 0 }),
  body('status').optional().isIn(['draft', 'sent', 'paid', 'overdue']),
  body('issueDate').notEmpty(),
  body('dueDate').notEmpty(),
  body('notes').optional().trim(),
  body('applyGST').optional().isBoolean(),
  body('isManualTax').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if custom invoice number is provided and if it already exists
    if (req.body.invoiceNumber) {
      const existing = await Invoice.findOne({
        where: {
          invoiceNumber: req.body.invoiceNumber,
          userId: req.user.id
        }
      });

      if (existing) {
        return res.status(400).json({
          message: 'Invoice number already exists. Please use a different number.'
        });
      }
    }

    const invoice = await Invoice.create({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/invoices/:id
// @desc    Get invoice by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private
router.put('/:id', [
  auth,
  body('clientName').optional().notEmpty().trim(),
  body('clientEmail').optional().isEmail().normalizeEmail(),
  body('clientAddress').optional().trim(),
  body('invoiceNumber').optional().trim(),
  body('items').optional().isArray({ min: 1 }),
  body('subtotal').optional().isFloat({ min: 0 }),
  body('tax').optional().isFloat({ min: 0 }),
  body('shippingCost').optional().isFloat({ min: 0 }),
  body('couponDiscount').optional().isFloat({ min: 0 }),
  body('total').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['draft', 'sent', 'paid', 'overdue']),
  body('issueDate').optional().notEmpty(),
  body('dueDate').optional().notEmpty(),
  body('notes').optional().trim(),
  body('applyGST').optional().isBoolean(),
  body('isManualTax').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if custom invoice number is being updated and if it already exists
    if (req.body.invoiceNumber) {
      const existing = await Invoice.findOne({
        where: {
          invoiceNumber: req.body.invoiceNumber,
          userId: req.user.id,
          id: { [require('sequelize').Op.ne]: req.params.id } // Exclude current invoice
        }
      });

      if (existing) {
        return res.status(400).json({
          message: 'Invoice number already exists. Please use a different number.'
        });
      }
    }

    const updateData = {};
    const allowedFields = [
      'clientName', 'clientEmail', 'clientAddress', 'invoiceNumber', 'items',
      'subtotal', 'tax', 'shippingCost', 'couponDiscount', 'total', 'status',
      'issueDate', 'dueDate', 'notes', 'applyGST', 'isManualTax'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const [updateCount] = await Invoice.update(updateData, {
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (updateCount === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = await Invoice.findByPk(req.params.id);
    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleteCount = await Invoice.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (deleteCount === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
