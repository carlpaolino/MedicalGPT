const path = require('path');
const logger = require('./logger');

// Check if we're using PostgreSQL (production) or SQLite (development)
const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');

let db, runQuery, getRow, getAll, beginTransaction, commitTransaction, rollbackTransaction, closeDatabase;

if (isPostgres) {
  // PostgreSQL configuration for production
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Test the connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      logger.error('Error connecting to PostgreSQL:', err.message);
    } else {
      logger.info('Connected to PostgreSQL database');
    }
  });

  runQuery = (sql, params = []) => {
    return pool.query(sql, params)
      .then(result => ({ id: result.rows[0]?.id, changes: result.rowCount }))
      .catch(err => {
        logger.error('Database query error:', err);
        throw err;
      });
  };

  getRow = (sql, params = []) => {
    return pool.query(sql, params)
      .then(result => result.rows[0])
      .catch(err => {
        logger.error('Database query error:', err);
        throw err;
      });
  };

  getAll = (sql, params = []) => {
    return pool.query(sql, params)
      .then(result => result.rows)
      .catch(err => {
        logger.error('Database query error:', err);
        throw err;
      });
  };

  beginTransaction = () => pool.query('BEGIN');
  commitTransaction = () => pool.query('COMMIT');
  rollbackTransaction = () => pool.query('ROLLBACK');
  closeDatabase = () => pool.end();

  db = pool; // For compatibility with existing code

} else {
  // SQLite configuration for development
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../medgpt.db');

  // Create database connection
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      logger.error('Error opening database:', err.message);
      throw err;
    }
    logger.info('Connected to SQLite database');
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Helper function to run queries with promises
  runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database query error:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  };

  // Helper function to get single row
  getRow = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database query error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  };

  // Helper function to get multiple rows
  getAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database query error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  };

  // Helper function to begin transaction
  beginTransaction = () => {
    return runQuery('BEGIN TRANSACTION');
  };

  // Helper function to commit transaction
  commitTransaction = () => {
    return runQuery('COMMIT');
  };

  // Helper function to rollback transaction
  rollbackTransaction = () => {
    return runQuery('ROLLBACK');
  };

  // Close database connection
  closeDatabase = () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err.message);
          reject(err);
        } else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    });
  };
}

module.exports = {
  db,
  runQuery,
  getRow,
  getAll,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  closeDatabase,
  isPostgres
}; 