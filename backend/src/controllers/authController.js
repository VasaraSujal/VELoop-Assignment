import { AuthService } from '../services/authService.js';
import { WalletService } from '../services/walletService.js';
import { config } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Handles Development Demo User Login
 */
export const demoLogin = async (req, res) => {
  if (config.nodeEnv === 'production' && process.env.ENABLE_DEMO_AUTH !== 'true') {
    return res.status(403).json({
      success: false,
      code: 'DEMO_AUTH_DISABLED',
      message: 'Demo authentication is disabled in production environments.',
    });
  }

  try {
    const { userId } = req.body;
    const result = await AuthService.demoLogin(userId || 'user_alex');
    return sendSuccess(res, 200, `Authenticated as ${result.user.name}`, result);
  } catch (error) {
    return sendError(res, 400, error.message || 'Demo login failed');
  }
};

/**
 * Returns currently authenticated user and authoritative wallet balances
 */
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'LOGIN_REQUIRED',
        message: 'No active session found.',
      });
    }

    const balances = await WalletService.getBalances(req.user.userId);
    const data = {
      ...req.user,
      balances,
    };

    return sendSuccess(res, 200, 'User profile retrieved', data);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve user profile');
  }
};

/**
 * Lists available demo personas (strictly disabled in production)
 */
export const getDemoUsers = async (req, res) => {
  if (config.nodeEnv === 'production') {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Demo user listing is disabled in production.',
    });
  }

  try {
    const users = await AuthService.listDemoUsers();
    return sendSuccess(res, 200, 'Demo users retrieved', users);
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to list demo accounts');
  }
};

export default { demoLogin, getMe, getDemoUsers };
