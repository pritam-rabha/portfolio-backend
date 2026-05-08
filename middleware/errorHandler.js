/**
 * Centralised Express error handler.
 * Must be the LAST middleware registered in server.js.
 *
 * All route errors should be passed via next(err).
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose: duplicate key (e.g. unique email) ──────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `An account with that ${field} already exists.`;
    statusCode = 409;
  }

  // ── Mongoose: validation errors ──────────────────────────────────────────
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
    statusCode = 422;
  }

  // ── Mongoose: invalid ObjectId ───────────────────────────────────────────
  if (err.name === 'CastError') {
    message = `Invalid value for field: ${err.path}`;
    statusCode = 400;
  }

  // ── JWT errors (backup — auth middleware handles most) ───────────────────
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token.';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Token expired.';
    statusCode = 401;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/** Convenience factory for creating structured errors. */
const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export { errorHandler, createError };
