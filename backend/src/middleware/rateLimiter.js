/**
 * Rate Limiting Middleware Foundation
 * In Phase 0, provides a lightweight pass-through structure ready for Redis/Token-Bucket enforcement in Phase 1.
 */

export const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const userRecord = requests.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > userRecord.resetTime) {
      userRecord.count = 1;
      userRecord.resetTime = now + windowMs;
    } else {
      userRecord.count += 1;
    }

    requests.set(ip, userRecord);

    if (userRecord.count > max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down.',
      });
    }

    next();
  };
};

export default rateLimiter;
