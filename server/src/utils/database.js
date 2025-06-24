const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./logger');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../medgpt.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Error opening database:', err.message);
    throw err;
  }
  logger.info('Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
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
const getRow = (sql, params = []) => {
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
const getAll = (sql, params = []) => {
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
const beginTransaction = () => {
  return runQuery('BEGIN TRANSACTION');
};

// Helper function to commit transaction
const commitTransaction = () => {
  return runQuery('COMMIT');
};

// Helper function to rollback transaction
const rollbackTransaction = () => {
  return runQuery('ROLLBACK');
};

// Close database connection
const closeDatabase = () => {
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

module.exports = {
  db,
  runQuery,
  getRow,
  getAll,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  closeDatabase
}; 