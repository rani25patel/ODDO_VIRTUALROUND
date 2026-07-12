/**
 * middleware/error.js
 * Centralized error handling: 404 fallback + global error handler.
 * Recognizes MySQL error codes and the SIGNAL SQLSTATE '45000' custom
 * business-rule errors raised by the stored procedures/triggers
 * (e.g. "Asset is currently held - use transfer request instead",
 * "Booking overlaps with an existing reservation") and maps them to
 * clean 4xx responses instead of leaking raw SQL errors.
 */

'use strict';

const ApiResponse = require('../utils/apiResponse');

/**
 * Custom application error class. Controllers (next phase) can throw
 * `new AppError('message', 404)` and this handler will format it.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function notFound(req, res, next) {
  return ApiResponse.error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * MySQL error code -> HTTP status/message mapping.
 * SIGNAL SQLSTATE '45000' from procedures/triggers surfaces here as
 * err.sqlState === '45000' with the business message in err.sqlMessage.
 */
function mapDatabaseError(err) {
  if (err.sqlState === '45000') {
    // Business-rule violation raised deliberately via SIGNAL in a
    // procedure/trigger (double-allocation, booking overlap, etc.)
    return { statusCode: 409, message: err.sqlMessage || 'Business rule violation' };
  }

  switch (err.code) {
    case 'ER_DUP_ENTRY':
      return { statusCode: 409, message: 'A record with this value already exists.' };
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      return { statusCode: 400, message: 'Referenced record does not exist.' };
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      return { statusCode: 409, message: 'Cannot delete/update: record is referenced elsewhere.' };
    case 'ER_BAD_NULL_ERROR':
      return { statusCode: 400, message: 'A required field is missing.' };
    case 'ER_DATA_TOO_LONG':
      return { statusCode: 400, message: 'A field value is too long.' };
    case 'ER_PARSE_ERROR':
    case 'ER_BAD_FIELD_ERROR':
      return { statusCode: 500, message: 'Internal query error.' };
    case 'ECONNREFUSED':
    case 'PROTOCOL_CONNECTION_LOST':
      return { statusCode: 503, message: 'Database connection unavailable. Please try again shortly.' };
    default:
      return null;
  }
}

/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
  // Multer errors (file too large, wrong type, etc.)
  if (err.name === 'MulterError') {
    return ApiResponse.error(res, `Upload error: ${err.message}`, 400);
  }

  const dbMapped = mapDatabaseError(err);
  if (dbMapped) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[DB ERROR]', err.code || err.sqlState, err.sqlMessage || err.message);
    }
    return ApiResponse.error(res, dbMapped.message, dbMapped.statusCode);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : (statusCode === 500 ? 'Internal server error' : err.message);

  if (statusCode === 500) {
    console.error('[UNHANDLED ERROR]', err);
  }

  return ApiResponse.error(
    res,
    message,
    statusCode,
    process.env.NODE_ENV !== 'production' ? { stack: err.stack } : undefined
  );
}
/* eslint-enable no-unused-vars */

module.exports = {
  AppError,
  notFound,
  errorHandler,
};
