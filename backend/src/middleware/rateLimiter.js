/**
 * Rate Limiting Middleware
 * Protects public and sensitive API endpoints against denial-of-service and brute force abuse.
 */

export const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const message = options.message || 'Too many requests. Please slow down.';
  const code = options.code || 'RATE_LIMITED';
  const requests = new Map();

  return (req, res, next) => {
    // Key by authenticated userId if available, else by IP
    const key = (req.user && req.user.userId) ? `user_${req.user.userId}` : (req.ip || req.headers['x-forwarded-for'] || 'unknown');
    const now = Date.now();
    const userRecord = requests.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > userRecord.resetTime) {
      userRecord.count = 1;
      userRecord.resetTime = now + windowMs;
    } else {
      userRecord.count += 1;
    }

    requests.set(key, userRecord);

    if (userRecord.count > max) {
      return res.status(429).json({
        success: false,
        code,
        message,
      });
    }

    next();
  };
};

/**
 * Strict rate limiter for sensitive financial/participation actions
 * Max 10 attempts per minute
 */
export const joinRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  code: 'RATE_LIMITED',
  message: 'Too many join attempts. Please wait a moment before trying again.',
});

export default rateLimiter;
