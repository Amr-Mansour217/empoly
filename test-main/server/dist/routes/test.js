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
const db_1 = require("../config/db");
const router = express_1.default.Router();
// Complete supervisor assignment implementation
router.post('/supervisor-assign', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('FULL IMPLEMENTATION IN TEST ROUTE');
    console.log('Request body:', req.body);
    try {
        const { employeeId, supervisorId } = req.body;
        if (!employeeId || !supervisorId) {
            return res.status(400).json({
                message: 'Missing required fields',
                requiredFields: ['employeeId', 'supervisorId'],
                receivedData: req.body
            });
        }
        // Parse IDs to ensure they're numbers
        const empId = Number(employeeId);
        const supId = Number(supervisorId);
        if (isNaN(empId) || isNaN(supId)) {
            return res.status(400).json({
                message: 'IDs must be valid numbers',
                receivedValues: { employeeId, supervisorId }
            });
        }
        console.log(`Checking if employee ${empId} exists...`);
        // Check if employee exists
        const [empRows] = yield db_1.pool.execute('SELECT id, role FROM users WHERE id = ?', [empId]);
        if (!empRows || empRows.length === 0) {
            console.log(`Employee with ID ${empId} not found`);
            return res.status(404).json({
                message: `Employee not found with ID: ${empId}`
            });
        }
        const employee = empRows[0];
        console.log('Employee found:', employee);
        console.log(`Checking if supervisor ${supId} exists...`);
        // Check if supervisor exists
        const [supRows] = yield db_1.pool.execute('SELECT id, role FROM users WHERE id = ?', [supId]);
        if (!supRows || supRows.length === 0) {
            console.log(`Supervisor with ID ${supId} not found`);
            return res.status(404).json({
                message: `Supervisor not found with ID: ${supId}`
            });
        }
        const supervisor = supRows[0];
        console.log('Supervisor found:', supervisor);
        // Validate roles
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
        console.log('Creating/updating assignment record...');
        // Create or update assignment
        const [result] = yield db_1.pool.execute('REPLACE INTO employee_supervisors (employee_id, supervisor_id) VALUES (?, ?)', [empId, supId]);
        console.log('Assignment operation result:', result);
        if (!result || result.affectedRows === 0) {
            return res.status(500).json({
                message: 'Database operation failed',
                details: result
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Supervisor assigned successfully',
            assignment: {
                employeeId: empId,
                supervisorId: supId,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error in supervisor assignment:', error);
        return res.status(500).json({
            message: 'Server error occurred during supervisor assignment',
            error: error.message || 'Unknown error'
        });
    }
}));
exports.default = router;
