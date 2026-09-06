import { sendError } from '../utils/responseHelper.js';

/**
 * Centralized express error handling middleware
 */
export const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, statusCode, message, err.errors || null);
};

export default errorHandler;
