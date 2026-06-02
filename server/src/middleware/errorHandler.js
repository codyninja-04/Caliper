// Central error handler. Normalizes thrown errors and Supabase/PostgREST errors
// into a consistent JSON envelope. Must be registered LAST in app.js.
function errorHandler(err, req, res, _next) {
  // Supabase/PostgREST errors carry a `code` and `message`.
  const status = err.status || err.statusCode || (err.code === '23505' ? 409 : 500);

  if (status >= 500) {
    console.error('[errorHandler]', err);
  }

  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(err.code ? { code: err.code } : {}),
    ...(process.env.NODE_ENV === 'development' && err.stack
      ? { stack: err.stack }
      : {}),
  });
}

// 404 fallthrough for unmatched routes.
function notFound(req, res) {
  res.status(404).json({ success: false, error: `Not found: ${req.method} ${req.path}` });
}

// Wraps async route handlers so rejected promises hit errorHandler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, notFound, asyncHandler };
