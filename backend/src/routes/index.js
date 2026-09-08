import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import giveawayRoutes from './giveawayRoutes.js';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/giveaways', giveawayRoutes);
router.use('/admin', adminRoutes);

export default router;
