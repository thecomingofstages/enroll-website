const Logger = require('../utils/Logger.util');

// eslint-disable-next-line no-unused-vars
function ErrorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const code       = err.code       || 'INTERNAL_ERROR';
  const message    = err.message    || 'An unexpected error occurred.';

  if (statusCode >= 500) {
    Logger.error(`[${req.method}] ${req.path} — ${message}\n${err.stack}`);
  } else {
    Logger.warn(`[${req.method}] ${req.path} — ${statusCode} ${code}: ${message}`);
  }

  return res.status(statusCode).json({
    success: false,
    error: { code, message, ...(err.field ? { field: err.field } : {}) },
  });
}

module.exports = ErrorHandler;
