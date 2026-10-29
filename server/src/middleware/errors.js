export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error('[Server Error]', err);

  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with this value already exists' });
  }

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: err.message });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'Server error',
  });
}
