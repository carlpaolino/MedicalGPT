const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const conversationService = require('../services/conversationService');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/conversations - Get all conversations for user
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
  query('archived').optional().isBoolean().withMessage('Archived must be a boolean')
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

    const { limit = 50, offset = 0, archived = false } = req.query;

    const conversations = await conversationService.getConversationsByUserId(
      undefined, 
      parseInt(limit), 
      parseInt(offset)
    );

    // Filter by archived status if specified
    const filteredConversations = archived === 'true' 
      ? conversations.filter(c => c.is_archived)
      : conversations.filter(c => !c.is_archived);

    res.json({
      success: true,
      data: filteredConversations
    });
  } catch (error) {
    logger.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conversations/recent - Get recent conversations for sidebar
router.get('/recent', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
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

    const { limit = 10 } = req.query;

    const conversations = await conversationService.getRecentConversations(
      undefined, 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error('Error getting recent conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conversations/:id - Get specific conversation with messages
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Conversation ID must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer')
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

    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Get conversation details
    const conversation = await conversationService.getConversationById(id, undefined);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages
    const messages = await conversationService.getConversationMessages(
      id, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json({
      success: true,
      data: {
        conversation,
        messages
      }
    });
  } catch (error) {
    logger.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/conversations/:id/title - Update conversation title
router.put('/:id/title', [
  param('id').isInt({ min: 1 }).withMessage('Conversation ID must be a positive integer'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters')
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

    const { id } = req.params;
    const { title } = req.body;

    await conversationService.updateConversationTitle(id, undefined, title);

    res.json({
      success: true,
      message: 'Conversation title updated successfully'
    });
  } catch (error) {
    logger.error('Error updating conversation title:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// PUT /api/conversations/:id/archive - Toggle conversation archive status
router.put('/:id/archive', [
  param('id').isInt({ min: 1 }).withMessage('Conversation ID must be a positive integer')
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

    const { id } = req.params;

    const result = await conversationService.toggleConversationArchive(id, undefined);

    res.json({
      success: true,
      message: `Conversation ${result.isArchived ? 'archived' : 'unarchived'} successfully`,
      data: result
    });
  } catch (error) {
    logger.error('Error toggling conversation archive:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// DELETE /api/conversations/:id - Delete conversation (soft delete)
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Conversation ID must be a positive integer')
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

    const { id } = req.params;

    await conversationService.deleteConversation(id, undefined);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// GET /api/conversations/search - Search conversations
router.get('/search', [
  query('q').trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

    const { q, limit = 20 } = req.query;

    const conversations = await conversationService.searchConversations(
      undefined, 
      q, 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error('Error searching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conversations/stats - Get conversation statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await conversationService.getConversationStats(undefined);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting conversation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 