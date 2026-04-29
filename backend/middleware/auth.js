const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Bypassing auth: Always attach a dummy user
    req.user = { id: 1, userId: 1, email: 'itsupport@technosprint.net' };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(); // Still proceed even on error
  }
};

module.exports = authMiddleware;
