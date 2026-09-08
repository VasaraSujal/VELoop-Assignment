import { Router } from 'express';
import { demoLogin, getMe, getDemoUsers } from '../controllers/authController.js';
import { authenticateUser, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Demo Authentication Endpoints
router.post('/demo-login', demoLogin);
router.get('/users', getDemoUsers);

// Protected user profile & balance endpoint
router.get('/me', authenticateUser, requireAuth, getMe);

export default router;
