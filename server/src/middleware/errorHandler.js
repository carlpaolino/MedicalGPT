const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.details;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    message = 'Resource conflict';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too many requests';
  } else if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 400;
    message = 'Database constraint violation';
  } else if (err.code === 'SQLITE_BUSY') {
    statusCode = 503;
    message = 'Database temporarily unavailable';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'External service unavailable';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service connection refused';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Request timeout';
  }

  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    details = {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    };
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { 
      timestamp: new Date().toISOString(),
      path: req.path 
    })
  });
};

module.exports = errorHandler; 