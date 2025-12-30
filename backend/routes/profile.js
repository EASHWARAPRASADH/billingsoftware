const express = require('express');
const { body, validationResult } = require('express-validator');
const BusinessProfile = require('../models/BusinessProfile');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/profile
// @desc    Get business profile
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profile
// @desc    Update business profile
// @access  Private
router.put('/', [
  auth,
  body('businessName').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('taxRate').optional().isFloat({ min: 0, max: 100 }),
  body('currency').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = {};
    const allowedFields = ['businessName', 'email', 'phone', 'address', 'taxRate', 'currency', 'logo', 'signature'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const [profile, created] = await BusinessProfile.upsert(
      { ...updateData, userId: req.user.id },
      { returning: true }
    );

    // Fetch the updated profile
    const updatedProfile = await BusinessProfile.findOne({ where: { userId: req.user.id } });
    res.json(updatedProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
