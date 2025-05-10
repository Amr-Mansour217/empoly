import express from 'express';
import userController from '../controllers/users';
import { authenticateToken, isAdmin, isSupervisor, isOwnerOrSupervisor } from '../middleware/auth';

const router = express.Router();

// Admin only routes
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);
router.post('/:id', authenticateToken, isAdmin, userController.updateUser);
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);

// Admin and supervisor routes
router.get('/employees', authenticateToken, isSupervisor, userController.getAllEmployees);
router.get('/supervisors', authenticateToken, isSupervisor, userController.getAllSupervisors);
router.post('/assign-supervisor', authenticateToken, isAdmin, userController.assignSupervisor);

// Protected routes with ownership check
router.get('/:id', authenticateToken, isOwnerOrSupervisor, userController.getUserById);
router.get('/:id/supervisor', authenticateToken, isOwnerOrSupervisor, userController.getSupervisorForEmployee);
router.get('/supervisor/:id/employees', authenticateToken, isSupervisor, userController.getEmployeesBySupervisor);

export default router; 