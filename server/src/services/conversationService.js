const { runQuery, getRow, getAll } = require('../utils/database');
const logger = require('../utils/logger');

class ConversationService {
  // Create a new conversation
  async createConversation(title) {
    try {
      const result = await runQuery(
        'INSERT INTO conversations (title) VALUES (?) RETURNING id',
        [title]
      );
      logger.info(`Created conversation ${result.id}`);
      return {
        id: result.id,
        title,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversationById(conversationId) {
    try {
      const conversation = await getRow(
        'SELECT * FROM conversations WHERE id = ?',
        [conversationId]
      );
      return conversation;
    } catch (error) {
      logger.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Get all conversations
  async getAllConversations(limit = 50, offset = 0) {
    try {
      const conversations = await getAll(
        `SELECT 
          c.id,
          c.title,
          c.created_at,
          c.updated_at,
          c.is_archived,
          COUNT(m.id) as message_count
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return conversations;
    } catch (error) {
      logger.error('Error getting conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId, limit = 100, offset = 0) {
    try {
      const messages = await getAll(
        `SELECT 
          id,
          role,
          content,
          created_at,
          tokens_used,
          safety_flags,
          citations,
          triage_level
        FROM messages 
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT ? OFFSET ?`,
        [conversationId, limit, offset]
      );
      
      // Parse JSON fields
      return messages.map(message => ({
        ...message,
        safetyFlags: message.safety_flags ? JSON.parse(message.safety_flags) : [],
        citations: message.citations ? JSON.parse(message.citations) : []
      }));
    } catch (error) {
      logger.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // Add a message to a conversation
  async addMessage(conversationId, role, content, tokensUsed = null, safetyFlags = null, citations = null, triageLevel = null) {
    try {
      const result = await runQuery(
        `INSERT INTO messages 
        (conversation_id, role, content, tokens_used, safety_flags, citations, triage_level) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [conversationId, role, content, tokensUsed, safetyFlags, citations, triageLevel]
      );
      
      // Update conversation's updated_at timestamp
      await runQuery(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );
      
      logger.info(`Added ${role} message ${result.id} to conversation ${conversationId}`);
      
      return {
        id: result.id,
        conversationId,
        role,
        content,
        tokensUsed,
        safetyFlags: safetyFlags ? JSON.parse(safetyFlags) : [],
        citations: citations ? JSON.parse(citations) : [],
        triageLevel,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error adding message:', error);
      throw error;
    }
  }

  // Update conversation title
  async updateConversationTitle(conversationId, title) {
    try {
      const result = await runQuery(
        'UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, conversationId]
      );
      if (result.changes === 0) {
        throw new Error('Conversation not found');
      }
      logger.info(`Updated conversation ${conversationId} title to: ${title}`);
      return { success: true };
    } catch (error) {
      logger.error('Error updating conversation title:', error);
      throw error;
    }
  }

  // Archive/unarchive conversation
  async toggleConversationArchive(conversationId) {
    try {
      const conversation = await this.getConversationById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      const newArchiveStatus = !conversation.is_archived;
      const result = await runQuery(
        'UPDATE conversations SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newArchiveStatus ? 1 : 0, conversationId]
      );
      logger.info(`Toggled archive status for conversation ${conversationId} to: ${newArchiveStatus}`);
      return { success: true, isArchived: newArchiveStatus };
    } catch (error) {
      logger.error('Error toggling conversation archive:', error);
      throw error;
    }
  }

  // Delete conversation (soft delete by archiving)
  async deleteConversation(conversationId) {
    try {
      const result = await runQuery(
        'UPDATE conversations SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );
      if (result.changes === 0) {
        throw new Error('Conversation not found');
      }
      logger.info(`Soft deleted conversation ${conversationId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Get conversation statistics
  async getConversationStats() {
    try {
      const stats = await getRow(
        `SELECT 
          COUNT(*) as total_conversations,
          COUNT(CASE WHEN is_archived = 0 THEN 1 END) as active_conversations,
          COUNT(CASE WHEN is_archived = 1 THEN 1 END) as archived_conversations,
          MAX(updated_at) as last_activity
        FROM conversations`
      );
      return stats;
    } catch (error) {
      logger.error('Error getting conversation stats:', error);
      throw error;
    }
  }

  // Search conversations
  async searchConversations(query, limit = 20) {
    try {
      const conversations = await getAll(
        `SELECT DISTINCT
          c.id,
          c.title,
          c.created_at,
          c.updated_at,
          c.is_archived
        FROM conversations c
        JOIN messages m ON c.id = m.conversation_id
        WHERE (c.title LIKE ? OR m.content LIKE ?)
        ORDER BY c.updated_at DESC
        LIMIT ?`,
        [`%${query}%`, `%${query}%`, limit]
      );
      return conversations;
    } catch (error) {
      logger.error('Error searching conversations:', error);
      throw error;
    }
  }

  // Get recent conversations for sidebar
  async getRecentConversations(limit = 10) {
    try {
      const conversations = await getAll(
        `SELECT 
          c.id,
          c.title,
          c.updated_at,
          c.is_archived,
          m.content as last_message
        FROM conversations c
        LEFT JOIN messages m ON m.id = (
          SELECT id FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        )
        WHERE c.is_archived = 0
        ORDER BY c.updated_at DESC
        LIMIT ?`,
        [limit]
      );
      return conversations;
    } catch (error) {
      logger.error('Error getting recent conversations:', error);
      throw error;
    }
  }
}

module.exports = new ConversationService(); 