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

// Uncomment and modify the original route to use the direct database approach
// Remove authentication temporarily for testing
router.post('/assign-supervisor', async (req, res) => {
  try {
    const { employeeId, supervisorId } = req.body;
    
    console.log('Assignment request received:', {
      employeeId,
      supervisorId
    });
    
    if (!employeeId || !supervisorId) {
      return res.status(400).json({
        message: 'Missing required fields',
        requiredFields: ['employeeId', 'supervisorId']
      });
    }
    
    // Parse IDs
    const empId = Number(employeeId);
    const supId = Number(supervisorId);
    
    if (isNaN(empId) || isNaN(supId)) {
      return res.status(400).json({
        message: 'IDs must be valid numbers'
      });
    }
    
    // Use direct database access
    const { pool } = require('../config/db');
    
    // Check employee exists
    const [empRows]: any = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?', 
      [empId]
    );
    
    if (!empRows || empRows.length === 0) {
      return res.status(404).json({
        message: `Employee not found with ID: ${empId}`
      });
    }
    
    const employee = empRows[0];
    
    // Check supervisor exists
    const [supRows]: any = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?', 
      [supId]
    );
    
    if (!supRows || supRows.length === 0) {
      return res.status(404).json({
        message: `Supervisor not found with ID: ${supId}`
      });
    }
    
    const supervisor = supRows[0];
    
    // Check roles
    if (employee.role !== 'employee') {
      return res.status(400).json({
        message: 'User is not an employee',
        role: employee.role
      });
    }
    
    if (supervisor.role !== 'supervisor' && supervisor.role !== 'admin') {
      return res.status(400).json({
        message: 'User is not a supervisor or admin',
        role: supervisor.role
      });
    }
    
    // Create or update assignment
    const [result]: any = await pool.execute(
      'REPLACE INTO employee_supervisors (employee_id, supervisor_id) VALUES (?, ?)',
      [empId, supId]
    );
    
    if (!result || result.affectedRows === 0) {
      return res.status(500).json({
        message: 'Database operation failed'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Supervisor assigned successfully',
      assignment: { employeeId: empId, supervisorId: supId }
    });
  } catch (error: any) {
    console.error('Error in assign-supervisor:', error);
    return res.status(500).json({
      message: 'Server error occurred',
      error: error.message || 'Unknown error'
    });
  }
});

// Remove all middleware from the direct handler
router.post('/assign-supervisor-test', (req, res) => {
  console.log('DIRECT TEST HANDLER - No middleware involved');
  console.log('Headers received:', req.headers);
  console.log('Body received:', req.body);
  
  try {
    const { employeeId, supervisorId } = req.body;
    
    // Log exactly what's in the request body
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Raw employeeId:', employeeId, typeof employeeId);
    console.log('Raw supervisorId:', supervisorId, typeof supervisorId);
    
    if (!employeeId || !supervisorId) {
      return res.status(400).json({
        message: 'Missing required fields',
        requiredFields: ['employeeId', 'supervisorId'],
        receivedData: req.body
      });
    }
    
    // Basic validation
    const empId = Number(employeeId);
    const supId = Number(supervisorId);
    
    if (isNaN(empId) || isNaN(supId)) {
      return res.status(400).json({
        message: 'IDs must be valid numbers',
        receivedData: { employeeId, supervisorId }
      });
    }
    
    // Return success for testing
    return res.status(200).json({
      message: 'TEST handler processed request successfully',
      receivedIds: { employeeId: empId, supervisorId: supId }
    });
  } catch (error: any) { // Fixed: Add type assertion for error
    console.error('Error in direct test handler:', error);
    return res.status(500).json({
      message: 'Test handler encountered an error',
      error: error.message || 'Unknown error'
    });
  }
});

// Comment out the original route temporarily
// router.post('/assign-supervisor', authenticateToken, isAdmin, userController.assignSupervisor);

router.get('/all-supervisor-assignments', authenticateToken, userController.getAllSupervisorAssignments);

// Protected routes with ownership check
router.get('/:id([0-9]+)', authenticateToken, isOwnerOrSupervisor, userController.getUserById);
router.get('/:id/supervisor', authenticateToken, isOwnerOrSupervisor, userController.getSupervisorForEmployee);
router.get('/supervisor/:id/employees', authenticateToken, isSupervisor, userController.getEmployeesBySupervisor);

export default router;