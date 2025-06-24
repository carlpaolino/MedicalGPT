const express = require('express');
const { param, body, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const conversationService = require('../services/conversationService');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/export/pdf - Export conversation as PDF
router.post('/pdf', [
  body('conversationId').isInt({ min: 1 }).withMessage('Conversation ID must be a positive integer'),
  body('includeMetadata').optional().isBoolean().withMessage('Include metadata must be a boolean')
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

    const { conversationId, includeMetadata = true } = req.body;
    const userId = req.user.id;

    // Get conversation and verify ownership
    const conversation = await conversationService.getConversationById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get all messages for the conversation
    const messages = await conversationService.getConversationMessages(conversationId, 1000, 0);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="medgpt-conversation-${conversationId}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('MedGPT Conversation Report', { align: 'center' });

    doc.moveDown();

    // Add metadata if requested
    if (includeMetadata) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Conversation Details:');

      doc.fontSize(10)
         .font('Helvetica')
         .text(`Title: ${conversation.title || 'Untitled'}`)
         .text(`Date: ${new Date(conversation.created_at).toLocaleDateString()}`)
         .text(`Messages: ${messages.length}`);

      doc.moveDown();
    }

    // Add medical disclaimer
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('IMPORTANT MEDICAL DISCLAIMER:', { color: 'red' });

    doc.fontSize(9)
       .font('Helvetica')
       .text('This conversation is for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.', { color: 'red' });

    doc.moveDown();

    // Add conversation content
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Conversation:', { underline: true });

    doc.moveDown();

    let messageCount = 0;
    for (const message of messages) {
      messageCount++;
      
      // Add message header
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(`${message.role === 'user' ? 'You' : 'MedGPT'} (${new Date(message.created_at).toLocaleString()}):`, { color: message.role === 'user' ? 'blue' : 'green' });

      // Add message content
      doc.fontSize(9)
         .font('Helvetica')
         .text(message.content, { align: 'justify' });

      // Add triage level if available
      if (message.triage_level) {
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .text(`Care Level: ${message.triage_level.replace('_', ' ').toUpperCase()}`, { color: 'orange' });
      }

      // Add citations if available
      if (message.citations && message.citations.length > 0) {
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .text('Sources:');
        
        message.citations.forEach(citation => {
          doc.fontSize(7)
             .font('Helvetica')
             .text(`[${citation.number}] ${citation.source.name}: ${citation.source.url}`);
        });
      }

      doc.moveDown();

      // Add page break if needed
      if (messageCount % 5 === 0) {
        doc.addPage();
      }
    }

    // Add footer
    doc.fontSize(8)
       .font('Helvetica')
       .text(`Generated on ${new Date().toLocaleString()} by MedGPT`, { align: 'center' });

    // Finalize PDF
    doc.end();

    logger.info(`PDF export generated for conversation ${conversationId} by user ${userId}`);

  } catch (error) {
    logger.error('Error generating PDF export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF export'
    });
  }
});

// POST /api/export/email - Send conversation via email
router.post('/email', [
  body('conversationId').isInt({ min: 1 }).withMessage('Conversation ID must be a positive integer'),
  body('email').isEmail().withMessage('Valid email address is required'),
  body('subject').optional().isLength({ max: 200 }).withMessage('Subject must be less than 200 characters'),
  body('message').optional().isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters')
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

    const { conversationId, email, subject, message } = req.body;
    const userId = req.user.id;

    // Get conversation and verify ownership
    const conversation = await conversationService.getConversationById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages
    const messages = await conversationService.getConversationMessages(conversationId, 1000, 0);

    // Create email content
    const emailSubject = subject || `MedGPT Conversation: ${conversation.title || 'Untitled'}`;
    const emailBody = this.createEmailContent(conversation, messages, message);

    // TODO: Implement email sending functionality
    // For now, just log the email details
    logger.info(`Email export requested for conversation ${conversationId} to ${email}`);

    res.json({
      success: true,
      message: 'Email export request received (email functionality not implemented in this version)',
      data: {
        to: email,
        subject: emailSubject,
        conversationId
      }
    });

  } catch (error) {
    logger.error('Error processing email export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process email export'
    });
  }
});

// Helper function to create email content
function createEmailContent(conversation, messages, customMessage) {
  let content = `MedGPT Conversation Report\n\n`;
  content += `Conversation: ${conversation.title || 'Untitled'}\n`;
  content += `Date: ${new Date(conversation.created_at).toLocaleDateString()}\n`;
  content += `Messages: ${messages.length}\n\n`;

  if (customMessage) {
    content += `Personal Note: ${customMessage}\n\n`;
  }

  content += `IMPORTANT MEDICAL DISCLAIMER:\n`;
  content += `This conversation is for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.\n\n`;

  content += `CONVERSATION:\n\n`;

  for (const message of messages) {
    content += `${message.role === 'user' ? 'You' : 'MedGPT'} (${new Date(message.created_at).toLocaleString()}):\n`;
    content += `${message.content}\n\n`;
    
    if (message.triage_level) {
      content += `Care Level: ${message.triage_level.replace('_', ' ').toUpperCase()}\n\n`;
    }
  }

  content += `\nGenerated on ${new Date().toLocaleString()} by MedGPT`;

  return content;
}

// GET /api/export/formats - Get available export formats
router.get('/formats', async (req, res) => {
  try {
    const formats = [
      {
        id: 'pdf',
        name: 'PDF Document',
        description: 'Download conversation as a PDF file',
        icon: '📄'
      },
      {
        id: 'email',
        name: 'Email',
        description: 'Send conversation via email',
        icon: '📧'
      },
      {
        id: 'text',
        name: 'Plain Text',
        description: 'Download as plain text file',
        icon: '📝'
      }
    ];

    res.json({
      success: true,
      data: formats
    });
  } catch (error) {
    logger.error('Error getting export formats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 