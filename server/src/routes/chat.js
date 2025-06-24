const express = require('express');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const conversationService = require('../services/conversationService');
const logger = require('../utils/logger');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

const router = express.Router();

// Validation middleware
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('conversationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer'),
  body('stream')
    .optional()
    .isBoolean()
    .withMessage('Stream must be a boolean value')
];

// Multer setup for file uploads (memory storage, no disk persistence)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .md, .pdf, and image files (.jpg, .jpeg, .png, .gif, .bmp, .webp) are allowed'));
    }
  }
});

// POST /api/chat - Send a message and get AI response (with optional file)
router.post('/', upload.single('file'), validateChatMessage, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    let { message, conversationId, stream = false } = req.body;
    const userId = req.user.id;

    // If a file is uploaded, read its content and append to message
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      let fileText = '';
      if (ext === '.txt' || ext === '.md') {
        fileText = req.file.buffer.toString('utf-8');
      } else if (ext === '.pdf') {
        // Use pdf-parse to extract text from PDF
        const pdfParse = require('pdf-parse');
        try {
          const data = await pdfParse(req.file.buffer);
          fileText = data.text;
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: 'Failed to read PDF file.'
          });
        }
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
        // Use OCR to extract text from images
        try {
          const result = await Tesseract.recognize(
            req.file.buffer,
            'eng',
            { logger: m => logger.debug(`OCR: ${m.status}`) }
          );
          fileText = result.data.text;
        } catch (err) {
          logger.error('OCR error:', err);
          return res.status(400).json({
            success: false,
            message: 'Failed to extract text from image.'
          });
        }
      }
      message += `\n\n[File uploaded: ${req.file.originalname}]\n${fileText}`;
    }

    logger.info(`Chat request from user ${userId}: ${message.substring(0, 100)}...`);

    // Get conversation history if conversationId is provided
    let conversationHistory = [];
    let currentConversationId = conversationId;

    if (conversationId) {
      // Verify conversation belongs to user
      const conversation = await conversationService.getConversationById(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }
      conversationHistory = await conversationService.getConversationMessages(conversationId);
    } else {
      // Create new conversation
      const newConversation = await conversationService.createConversation(userId, message.substring(0, 50));
      currentConversationId = newConversation.id;
    }

    // Defensive check for conversation ID
    if (!currentConversationId) {
      logger.error('No conversation ID found or created');
      return res.status(500).json({
        success: false,
        message: 'Failed to create or retrieve conversation ID.'
      });
    }

    // Save user message
    await conversationService.addMessage(currentConversationId, 'user', message);

    if (stream) {
      // Stream response
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');

      let fullResponse = '';
      let responseData = {};

      for await (const chunk of aiService.streamResponse(message, conversationHistory)) {
        if (chunk.error) {
          res.status(500).json({
            success: false,
            message: chunk.content
          });
          return;
        }

        if (chunk.done) {
          // Save final response data
          responseData = {
            safetyFlags: chunk.safetyFlags || [],
            triageLevel: chunk.triageLevel,
            citations: chunk.citations || [],
            tokensUsed: chunk.tokensUsed || 0
          };
          break;
        }

        fullResponse += chunk.content;
        res.write(chunk.content);
      }

      // Save AI response
      await conversationService.addMessage(
        currentConversationId,
        'assistant',
        fullResponse,
        responseData.tokensUsed,
        JSON.stringify(responseData.safetyFlags),
        JSON.stringify(responseData.citations),
        responseData.triageLevel
      );

      res.end();
    } else {
      // Non-streaming response
      const aiResponse = await aiService.generateResponse(message, conversationHistory);

      // Save AI response
      await conversationService.addMessage(
        currentConversationId,
        'assistant',
        aiResponse.content,
        aiResponse.tokensUsed,
        JSON.stringify(aiResponse.safetyFlags),
        JSON.stringify(aiResponse.citations),
        aiResponse.triageLevel
      );

      // Log analytics
      logger.info(`Chat response generated for user ${userId}, tokens: ${aiResponse.tokensUsed}, triage: ${aiResponse.triageLevel}`);

      res.json({
        success: true,
        data: {
          conversationId: currentConversationId,
          response: aiResponse.content,
          safetyFlags: aiResponse.safetyFlags,
          triageLevel: aiResponse.triageLevel,
          citations: aiResponse.citations,
          tokensUsed: aiResponse.tokensUsed
        }
      });
    }

  } catch (error) {
    logger.error('Error in chat route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/chat/suggestions - Get conversation suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = [
      "What are the common symptoms of a cold?",
      "How can I manage stress and anxiety?",
      "What should I do if I have a fever?",
      "How much water should I drink daily?",
      "What are the benefits of regular exercise?",
      "How can I improve my sleep quality?",
      "What foods are good for heart health?",
      "How do I know if I need to see a doctor?",
      "What are the warning signs of dehydration?",
      "How can I boost my immune system?"
    ];

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Error getting chat suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/chat/feedback - Submit feedback for a response
router.post('/feedback', [
  body('messageId').isInt({ min: 1 }).withMessage('Message ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isString().isLength({ max: 1000 }).withMessage('Feedback must be less than 1000 characters')
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

    const { messageId, rating, feedback } = req.body;
    const userId = req.user.id;

    // Save feedback (implementation would depend on your feedback storage)
    logger.info(`Feedback submitted for message ${messageId} by user ${userId}: ${rating}/5`);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 