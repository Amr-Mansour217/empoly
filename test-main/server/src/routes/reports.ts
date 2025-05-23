import express from 'express';
import reportController from '../controllers/reports';
import { authenticateToken, isAdmin, isSupervisor, isOwnerOrSupervisor } from '../middleware/auth';

const router = express.Router();

// Employee routes
router.post('/', authenticateToken, reportController.createReport);
router.get('/me/current', authenticateToken, reportController.getCurrentEmployeeReport);

// Admin and supervisor routes
router.get('/', authenticateToken, isSupervisor, reportController.getAllReports);
router.get('/stats', authenticateToken, isSupervisor, reportController.getSummaryStats);

// Protected routes with ownership check
router.get('/:id', authenticateToken, isOwnerOrSupervisor, reportController.getReportById);
router.get('/employee/:id', authenticateToken, isOwnerOrSupervisor, reportController.getReportsByEmployeeId);
router.get('/employee/:id/details', authenticateToken, isOwnerOrSupervisor, reportController.getEmployeeReportDetails);

export default router; 