import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import giveawayRoutes from './giveawayRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/giveaways', giveawayRoutes);

export default router;
