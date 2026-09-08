import { Router } from 'express';
import {
  getCurrentGiveaways,
  getPreviousGiveaways,
  getGiveawayStats,
  getGiveawayBySlug,
  getMyStatus,
  joinGiveaway,
  getRecentWinners,
  getPreviousWinners,
  getAllWinners,
  getWinners,
} from '../controllers/giveawayController.js';
import { authenticateUser, requireAuth } from '../middleware/authMiddleware.js';
import { validateJoinRequest, validateLookupIdentifier } from '../validators/giveawayValidator.js';
import { joinRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Platform & Discovery endpoints (Public)
router.get('/current', getCurrentGiveaways);
router.get('/previous/winners', getPreviousWinners);
router.get('/previous', getPreviousGiveaways);
router.get('/stats', getGiveawayStats);

// Winners Roster endpoints (Public)
router.get('/winners/recent', getRecentWinners);
router.get('/winners/previous', getPreviousWinners);
router.get('/winners', getAllWinners);

// Single Giveaway lookup (Public)
router.get('/:slug', validateLookupIdentifier, getGiveawayBySlug);

// User Participation status (Authenticated)
router.get('/:id/my-status', authenticateUser, requireAuth, getMyStatus);

// Join Giveaway (Authenticated + Rate Limited + Validated)
router.post(
  '/:id/join',
  authenticateUser,
  requireAuth,
  joinRateLimiter,
  validateJoinRequest,
  joinGiveaway
);

// Individual giveaway winners
// Individual giveaway winners (Public)
router.get('/:id/winners', validateLookupIdentifier, getWinners);

export default router;
