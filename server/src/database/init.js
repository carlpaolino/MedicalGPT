const { runQuery, getRow, getAll, isPostgres } = require('../utils/database');
const logger = require('../utils/logger');

// Create tables with database-agnostic SQL
const createTables = async () => {
  try {
    // Users table
    const createUsersTable = isPostgres ? `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    ` : `
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
    const createConversationsTable = isPostgres ? `
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    ` : `
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
    const createMessagesTable = isPostgres ? `
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tokens_used INTEGER,
        safety_flags TEXT,
        citations TEXT,
        triage_level VARCHAR(50),
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      )
    ` : `
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
    const createSafetyIncidentsTable = isPostgres ? `
      CREATE TABLE IF NOT EXISTS safety_incidents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        conversation_id INTEGER,
        message_id INTEGER,
        incident_type VARCHAR(100) NOT NULL,
        description TEXT,
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        resolved_by VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE SET NULL,
        FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE SET NULL
      )
    ` : `
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
    const createAnalyticsTable = isPostgres ? `
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        event_type VARCHAR(100) NOT NULL,
        event_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    ` : `
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

    for (const table of tables) {
      await runQuery(table.sql);
      logger.info(`Created ${table.name} table successfully`);
    }

  } catch (error) {
    logger.error('Error creating tables:', error);
    throw error;
  }
};

// Create indexes for better performance
const createIndexes = async () => {
  try {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_safety_incidents_user_id ON safety_incidents(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at)'
    ];

    for (const index of indexes) {
      await runQuery(index);
    }
    
    logger.info('Indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
};

// Initialize database
const initDatabase = async () => {
  try {
    logger.info('Starting database initialization...');
    logger.info(`Using ${isPostgres ? 'PostgreSQL' : 'SQLite'} database`);
    
    await createTables();
    await createIndexes();
    
    logger.info('Database initialization completed successfully');
    
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      logger.info('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase }; 