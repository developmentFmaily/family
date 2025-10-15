/**
 * Global Error Handling Middleware
 * Handles all types of errors in a consistent way
 */

const CODES = require('../utils/codes');
const ERROR_MESSAGES = require('../utils/messages.error');

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = CODES.NOT_FOUND;
  next(error);
};

/**
 * Global Error Handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('🚨 Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = {
      message,
      status: CODES.BAD_REQUEST
    };
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Resource already exists';
    error = {
      message,
      status: CODES.CONFLICT
    };
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Referenced resource does not exist';
    error = {
      message,
      status: CODES.BAD_REQUEST
    };
  }

  // Sequelize database connection errors
  if (err.name === 'SequelizeConnectionError') {
    const message = 'Database connection failed';
    error = {
      message,
      status: CODES.SERVER_ERROR
    };
  }

  // Joi validation errors
  if (err.isJoi) {
    const message = err.details.map(e => e.message).join(', ');
    error = {
      message,
      status: CODES.BAD_REQUEST
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      status: CODES.UNAUTHORIZED
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      status: CODES.UNAUTHORIZED
    };
  }

  // Syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'Invalid JSON format';
    error = {
      message,
      status: CODES.BAD_REQUEST
    };
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = {
      message,
      status: CODES.BAD_REQUEST
    };
  }

  // Rate limit errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = {
      message,
      status: CODES.TOO_MANY_REQUESTS || 429
    };
  }

  // Default to 500 server error
  const status = error.status || CODES.SERVER_ERROR;
  const message = error.message || ERROR_MESSAGES.SERVER_ERROR;

  // Don't leak error details in production
  const response = {
    success: false,
    message: message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
      error: err
    })
  };

  res.status(status).json(response);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
