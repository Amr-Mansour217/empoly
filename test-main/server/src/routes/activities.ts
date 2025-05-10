import express from 'express';
import activityController from '../controllers/activities';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes (accessible to all authenticated users)
router.get('/', authenticateToken, activityController.getAllActivities);
router.get('/:id', authenticateToken, activityController.getActivityById);

// Admin only routes
router.post('/', authenticateToken, isAdmin, activityController.createActivity);
router.put('/:id', authenticateToken, isAdmin, activityController.updateActivity);
router.delete('/:id', authenticateToken, isAdmin, activityController.deleteActivity);

export default router; 