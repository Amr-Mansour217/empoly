import express from 'express';
import dashboardController from '../controllers/dashboard';
import { authenticateToken, isSupervisor } from '../middleware/auth';

const router = express.Router();

// Admin and supervisor routes
router.get('/', authenticateToken, isSupervisor, dashboardController.getDashboardData);

// Employee routes
router.get('/employee', authenticateToken, dashboardController.getEmployeeDashboard);

export default router; 