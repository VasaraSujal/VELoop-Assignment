import { getDbStatus } from '../config/db.js';
import { sendSuccess } from '../utils/responseHelper.js';

/**
 * Health check endpoint controller.
 * Returns HTTP 200 with server status, uptime, and database connection state.
 */
export const getHealth = (req, res) => {
  const dbStatus = getDbStatus();

  return sendSuccess(res, 200, 'VELOOP Giveaway API is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
  });
};
