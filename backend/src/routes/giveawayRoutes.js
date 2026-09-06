import { Router } from 'express';
import {
  getCurrentGiveaways,
  getGiveawayBySlug,
  getPreviousGiveaways,
  getMyStatus,
  joinGiveaway,
  getWinners,
  submitPrizeClaim,
  getMyClaim,
} from '../controllers/giveawayController.js';

const router = Router();

// Giveaway discovery
router.get('/current', getCurrentGiveaways);
router.get('/previous', getPreviousGiveaways);
router.get('/:slug', getGiveawayBySlug);

// Participation & Entry
router.get('/:id/my-status', getMyStatus);
router.post('/:id/join', joinGiveaway);

// Winners & Claims
router.get('/:id/winners', getWinners);
router.post('/:id/claim', submitPrizeClaim);
router.get('/:id/my-claim', getMyClaim);

export default router;
