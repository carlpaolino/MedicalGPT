const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getRow } = require('../utils/database');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/auth/register - User registration
router.post('/register', [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await getRow('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await runQuery(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, name || null]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, email },
      process.env.JWT_SECRET || 'medgpt-secret-key',
      { expiresIn: '24h' }
    );

    logger.info(`New user registered: ${email} (ID: ${result.id})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.id,
          email,
          name: name || null
        },
        token
      }
    });

  } catch (error) {
    logger.error('Error in user registration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email address is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Get user by email
    const user = await getRow(
      'SELECT id, email, password_hash, name, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await runQuery(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'medgpt-secret-key',
      { expiresIn: '24h' }
    );

    logger.info(`User logged in: ${email} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });

  } catch (error) {
    logger.error('Error in user login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', async (req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token. However, we can log the logout event.
    
    if (req.user) {
      logger.info(`User logged out: ${req.user.email} (ID: ${req.user.id})`);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Error in user logout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await getRow(
      'SELECT id, email, name, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      }
    });

  } catch (error) {
    logger.error('Error getting user info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Generate new token
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || 'medgpt-secret-key',
      { expiresIn: '24h' }
    );

    logger.info(`Token refreshed for user: ${req.user.email} (ID: ${req.user.id})`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token }
    });

  } catch (error) {
    logger.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/change-password - Change password
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user with password hash
    const user = await getRow(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await runQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    logger.info(`Password changed for user: ${req.user.email} (ID: ${req.user.id})`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 