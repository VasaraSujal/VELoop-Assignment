import { verifyJwt } from '../services/authService.js';
import UserAccount from '../models/UserAccount.js';

/**
 * Extracts and verifies JWT from Authorization header, attaching user to req
 */
export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyJwt(token);
    const user = await UserAccount.findOne({ userId: payload.userId }).lean();

    if (!user || user.status !== 'ACTIVE') {
      req.user = null;
      return next();
    }

    req.user = {
      userId: user.userId,
      email: user.email,
      handle: user.handle,
      name: user.name,
      tier: user.tier,
      isKycVerified: user.isKycVerified,
      status: user.status,
    };
    next();
  } catch {
    req.user = null;
    next();
  }
};

/**
 * Enforces that user is authenticated
 */
export const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      code: 'LOGIN_REQUIRED',
      message: 'Authentication required to access this endpoint.',
    });
  }
  next();
};

/**
 * Enforces a minimum user tier requirement
 */
export const requireTier = (minTier = 0) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'LOGIN_REQUIRED',
        message: 'Authentication required.',
      });
    }

    if ((req.user.tier || 0) < minTier) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_TIER',
        message: `This action requires a minimum VIP Tier of ${minTier}. Current tier: ${req.user.tier || 0}.`,
      });
    }

    next();
  };
};

export default { authenticateUser, requireAuth, requireTier };
