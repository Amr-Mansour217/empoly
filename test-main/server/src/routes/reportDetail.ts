import express from 'express';
import reportDetailController from '../controllers/reportDetail';
import { authenticateToken, isOwnerOrSupervisor } from '../middleware/auth';

const router = express.Router();

// Get report details by employee ID and date
router.get('/employee/:employeeId/date/:date', authenticateToken, isOwnerOrSupervisor, reportDetailController.getReportByEmployeeAndDate);

export default router;
