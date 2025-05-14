import express from 'express';
import reportController from '../controllers/reports';
import { authenticateToken, isAdmin, isSupervisor, isOwnerOrSupervisor } from '../middleware/auth';

const router = express.Router();

// Employee routes
router.post('/', authenticateToken, reportController.createReport);
router.get('/me/current', authenticateToken, reportController.getCurrentEmployeeReport);

// تحديث التقرير الحالي للموظف
router.post('/today/:id', authenticateToken, isOwnerOrSupervisor, reportController.updateReport);

// Admin and supervisor routes
router.get('/', authenticateToken, isSupervisor, reportController.getAllReports);
router.get('/stats', authenticateToken, isSupervisor, reportController.getSummaryStats);

// Protected routes with ownership check
router.get('/:id', authenticateToken, isOwnerOrSupervisor, reportController.getReportById);
router.get('/employee/:id', authenticateToken, isOwnerOrSupervisor, reportController.getReportsByEmployeeId);

export default router;