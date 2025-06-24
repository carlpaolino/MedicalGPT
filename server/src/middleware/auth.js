const jwt = require('jsonwebtoken');
const { getRow } = require('../utils/database');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medgpt-secret-key');
    
    // Get user from database
    const user = await getRow(
      'SELECT id, email, name, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional authentication middleware (doesn't require token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medgpt-secret-key');
    
    // Get user from database
    const user = await getRow(
      'SELECT id, email, name, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // Token is invalid, but we don't fail the request
    req.user = null;
    next();
  }
};

module.exports = authMiddleware;
module.exports.optional = optionalAuthMiddleware; 