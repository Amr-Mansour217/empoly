import express from 'express';
import authController from '../controllers/auth';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', authController.login);

// Protected routes
router.post('/register', authenticateToken, isAdmin, authController.register);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/change-password', authenticateToken, authController.changePassword);

export default router; 