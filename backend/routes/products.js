const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { user_id: req.user.id },
      order: [['name', 'ASC']]
    });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
router.post('/', [
  auth,
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.create({
      user_id: req.user.id,
      ...req.body
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleteCount = await Product.destroy({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (deleteCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
