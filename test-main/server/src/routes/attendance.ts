import express from 'express';
import attendanceController from '../controllers/attendance';
import { authenticateToken, isAdmin, isSupervisor, isOwnerOrSupervisor } from '../middleware/auth';

const router = express.Router();

// Admin only routes
router.post('/mark', authenticateToken, isAdmin, attendanceController.markAttendance);
router.post('/check', authenticateToken, isAdmin, attendanceController.runDailyAttendanceCheck);

// Admin and supervisor routes
router.get('/', authenticateToken, isSupervisor, attendanceController.getAllAttendance);
router.get('/today', authenticateToken, isSupervisor, attendanceController.getTodayAttendance);

// Protected routes with ownership check
router.get('/employee/:id', authenticateToken, isOwnerOrSupervisor, attendanceController.getEmployeeAttendance);

export default router; 