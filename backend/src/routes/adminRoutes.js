import { Router } from 'express';
import { selectWinners } from '../controllers/adminController.js';
import { authenticateUser, requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All admin routes strictly enforce authentication + admin role authorization
router.use(authenticateUser, requireAuth, requireAdmin);

// POST /api/admin/giveaways/:id/select-winners
router.post('/giveaways/:id/select-winners', selectWinners);

export default router;
