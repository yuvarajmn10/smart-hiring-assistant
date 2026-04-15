const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No token provided. Please login first.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists'
      });
    }

    req.user = user;

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please login again.' });
    }
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

const recruiterOnly = (req, res, next) => {
  if (req.user && req.user.role === 'recruiter') {
    next();
  } else {
    res.status(403).json({
      message: 'Access denied. Recruiters only.'
    });
  }
};

const candidateOnly = (req, res, next) => {
  if (req.user && req.user.role === 'candidate') {
    next();
  } else {
    res.status(403).json({
      message: 'Access denied. Candidates only.'
    });
  }
};

module.exports = { protect, recruiterOnly, candidateOnly };