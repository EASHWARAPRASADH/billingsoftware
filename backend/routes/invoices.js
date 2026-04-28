const express = require('express');
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/invoices/check-duplicate
router.post('/check-duplicate', [
  auth,
  body('client_name').notEmpty().trim(),
  body('invoice_date').notEmpty(),
  body('total_amount').isFloat()
], async (req, res) => {
  try {
    const { client_name, invoice_date, total_amount } = req.body;

    const duplicate = await Invoice.findOne({
      where: {
        user_id: req.user.id,
        client_name,
        invoice_date,
        total_amount
      }
    });

    if (duplicate) {
      return res.json({
        exists: true,
        invoiceId: duplicate.id,
        invoiceNumber: duplicate.invoice_number
      });
    }

    res.json({ exists: false });
  } catch (error) {
    console.error('Check duplicate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/invoices
router.post('/', [
  auth,
  body('client_name').notEmpty().trim(),
  body('client_email').optional().isEmail().normalizeEmail(),
  body('invoice_number').optional().trim(),
  body('items').isArray({ min: 1 }),
  body('subtotal').isFloat({ min: 0 }),
  body('total_amount').isFloat({ min: 0 }),
  body('invoice_date').notEmpty(),
  body('due_date').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.invoice_number) {
      const existing = await Invoice.findOne({
        where: {
          invoice_number: req.body.invoice_number,
          user_id: req.user.id
        }
      });

      if (existing) {
        return res.status(400).json({
          message: 'Invoice number already exists. Please use a different number.'
        });
      }
    }

    if (req.body.amount_received !== undefined && req.body.total_amount !== undefined) {
      const received = parseFloat(req.body.amount_received);
      const total = parseFloat(req.body.total_amount);
      if (received >= total && total > 0) {
        req.body.status = 'paid';
      }
    }

    const invoice = await Invoice.create({
      user_id: req.user.id,
      ...req.body
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/invoices
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 1000
    });

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/invoices/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
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
router.put('/:id', [
  auth,
  body('client_name').optional().notEmpty().trim(),
  body('invoice_date').optional().notEmpty(),
  body('due_date').optional().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.invoice_number) {
      const existing = await Invoice.findOne({
        where: {
          invoice_number: req.body.invoice_number,
          user_id: req.user.id,
          id: { [require('sequelize').Op.ne]: req.params.id }
        }
      });

      if (existing) {
        return res.status(400).json({
          message: 'Invoice number already exists. Please use a different number.'
        });
      }
    }

    if (req.body.amount_received !== undefined && req.body.total_amount !== undefined) {
      const received = parseFloat(req.body.amount_received);
      const total = parseFloat(req.body.total_amount);
      if (received >= total && total > 0) {
        req.body.status = 'paid';
      } else if (req.body.status === 'paid' && received < total) {
        req.body.status = 'sent';
      }
    }

    const [updateCount] = await Invoice.update(req.body, {
      where: {
        id: req.params.id,
        user_id: req.user.id
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
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleteCount = await Invoice.destroy({
      where: {
        id: req.params.id,
        user_id: req.user.id
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
