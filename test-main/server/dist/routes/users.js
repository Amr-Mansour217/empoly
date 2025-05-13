"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_1 = __importDefault(require("../controllers/users"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Admin only routes
router.get('/', auth_1.authenticateToken, auth_1.isAdmin, users_1.default.getAllUsers);
router.post('/:id', auth_1.authenticateToken, auth_1.isAdmin, users_1.default.updateUser);
router.delete('/:id', auth_1.authenticateToken, auth_1.isAdmin, users_1.default.deleteUser);
// Admin and supervisor routes
router.get('/employees', auth_1.authenticateToken, auth_1.isSupervisor, users_1.default.getAllEmployees);
router.get('/supervisors', auth_1.authenticateToken, auth_1.isSupervisor, users_1.default.getAllSupervisors);
// Uncomment and modify the original route to use the direct database approach
// Remove authentication temporarily for testing
router.post('/assign-supervisor', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const [empRows] = yield pool.execute('SELECT id, role FROM users WHERE id = ?', [empId]);
        if (!empRows || empRows.length === 0) {
            return res.status(404).json({
                message: `Employee not found with ID: ${empId}`
            });
        }
        const employee = empRows[0];
        // Check supervisor exists
        const [supRows] = yield pool.execute('SELECT id, role FROM users WHERE id = ?', [supId]);
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
        const [result] = yield pool.execute('REPLACE INTO employee_supervisors (employee_id, supervisor_id) VALUES (?, ?)', [empId, supId]);
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
    }
    catch (error) {
        console.error('Error in assign-supervisor:', error);
        return res.status(500).json({
            message: 'Server error occurred',
            error: error.message || 'Unknown error'
        });
    }
}));
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
    }
    catch (error) { // Fixed: Add type assertion for error
        console.error('Error in direct test handler:', error);
        return res.status(500).json({
            message: 'Test handler encountered an error',
            error: error.message || 'Unknown error'
        });
    }
});
// Comment out the original route temporarily
// router.post('/assign-supervisor', authenticateToken, isAdmin, userController.assignSupervisor);
router.get('/all-supervisor-assignments', auth_1.authenticateToken, users_1.default.getAllSupervisorAssignments);
// Protected routes with ownership check
router.get('/:id([0-9]+)', auth_1.authenticateToken, auth_1.isOwnerOrSupervisor, users_1.default.getUserById);
router.get('/:id/supervisor', auth_1.authenticateToken, auth_1.isOwnerOrSupervisor, users_1.default.getSupervisorForEmployee);
router.get('/supervisor/:id/employees', auth_1.authenticateToken, auth_1.isSupervisor, users_1.default.getEmployeesBySupervisor);
exports.default = router;
