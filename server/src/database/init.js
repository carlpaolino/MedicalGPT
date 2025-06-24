const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../medgpt.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Error opening database:', err.message);
    process.exit(1);
  }
  logger.info('Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    // Users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )
    `;

    // Conversations table
    const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_archived BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    // Messages table
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        tokens_used INTEGER,
        safety_flags TEXT,
        citations TEXT,
        triage_level TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      )
    `;

    // Safety incidents table
    const createSafetyIncidentsTable = `
      CREATE TABLE IF NOT EXISTS safety_incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        conversation_id INTEGER,
        message_id INTEGER,
        incident_type TEXT NOT NULL,
        description TEXT,
        severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        resolved_by TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE SET NULL,
        FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE SET NULL
      )
    `;

    // Analytics table
    const createAnalyticsTable = `
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_type TEXT NOT NULL,
        event_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `;

    // Execute all table creation statements
    const tables = [
      { name: 'users', sql: createUsersTable },
      { name: 'conversations', sql: createConversationsTable },
      { name: 'messages', sql: createMessagesTable },
      { name: 'safety_incidents', sql: createSafetyIncidentsTable },
      { name: 'analytics', sql: createAnalyticsTable }
    ];

    let completed = 0;
    const total = tables.length;

    tables.forEach(table => {
      db.run(table.sql, (err) => {
        if (err) {
          logger.error(`Error creating ${table.name} table:`, err.message);
          reject(err);
          return;
        }
        logger.info(`Created ${table.name} table successfully`);
        completed++;
        
        if (completed === total) {
          resolve();
        }
      });
    });
  });
};

// Create indexes for better performance
const createIndexes = () => {
  return new Promise((resolve, reject) => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_safety_incidents_user_id ON safety_incidents(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at)'
    ];

    let completed = 0;
    const total = indexes.length;

    indexes.forEach(index => {
      db.run(index, (err) => {
        if (err) {
          logger.error('Error creating index:', err.message);
          reject(err);
          return;
        }
        completed++;
        
        if (completed === total) {
          resolve();
        }
      });
    });
  });
};

// Initialize database
const initDatabase = async () => {
  try {
    logger.info('Starting database initialization...');
    
    await createTables();
    logger.info('Tables created successfully');
    
    await createIndexes();
    logger.info('Indexes created successfully');
    
    logger.info('Database initialization completed successfully');
    
    // Close database connection
    db.close((err) => {
      if (err) {
        logger.error('Error closing database:', err.message);
      } else {
        logger.info('Database connection closed');
      }
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase, db }; 