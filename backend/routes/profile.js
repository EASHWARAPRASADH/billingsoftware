const express = require('express');
const { body, validationResult } = require('express-validator');
const BusinessProfile = require('../models/BusinessProfile');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/profile
router.get('/', auth, async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ where: { user_id: req.user.id } });
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
router.put('/', [
  auth,
  body('company_name').optional().notEmpty().trim(),
  body('company_email').optional().isEmail().normalizeEmail(),
  body('company_phone').optional().trim(),
  body('company_address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedFields = [
      'company_name', 'company_email', 'company_phone', 'company_address', 
      'company_logo', 'gst_number', 'pan_number', 'bank_name', 
      'account_number', 'ifsc_code', 'signature_image', 'tax_rate', 'currency'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await BusinessProfile.upsert(
      { ...updateData, user_id: req.user.id }
    );

    const updatedProfile = await BusinessProfile.findOne({ where: { user_id: req.user.id } });
    res.json(updatedProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
