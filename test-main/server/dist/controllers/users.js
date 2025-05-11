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
const user_1 = __importDefault(require("../models/user"));
class UserController {
    // Get all supervisors
    getAllSupervisors(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supervisors = yield user_1.default.getAllSupervisors();
                console.log(`Got ${supervisors.length} supervisors from model`);
                // Always return a success status with the array, even if empty
                return res.status(200).json({
                    supervisors,
                    success: true,
                    message: supervisors.length === 0 ? 'No supervisors found, you may need to create users first' : undefined
                });
            }
            catch (error) {
                console.error('Get all supervisors error:', error);
                // Return empty array even when error occurs to prevent client-side errors
                return res.status(200).json({
                    supervisors: [],
                    success: false,
                    error: true,
                    message: 'An error occurred while getting supervisors, using empty array'
                });
            }
        });
    }
    // Get all users
    getAllUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield user_1.default.getAll();
                console.log(`Users API - Found ${users.length} users`);
                return res.status(200).json({
                    users,
                    success: true,
                    // If no users are found, provide an informative message
                    message: users.length === 0 ? 'No users found in the system yet' : undefined
                });
            }
            catch (error) {
                console.error('Get all users error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'An error occurred while getting users',
                    users: [] // Always include empty users array even on error
                });
            }
        });
    }
    // Get user by ID
    getUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.params.id);
                if (isNaN(userId)) {
                    return res.status(400).json({ message: 'Invalid user ID' });
                }
                const user = yield user_1.default.getById(userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                return res.status(200).json({ user });
            }
            catch (error) {
                console.error('Get user by ID error:', error);
                return res.status(500).json({ message: 'An error occurred while getting user' });
            }
        });
    }
    // Update user
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.params.id);
                const { full_name, phone, nationality, location, role } = req.body;
                if (isNaN(userId)) {
                    return res.status(400).json({ message: 'Invalid user ID' });
                }
                // Check if user exists
                const user = yield user_1.default.getById(userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                // Update user
                const updated = yield user_1.default.update(userId, {
                    full_name,
                    phone,
                    nationality,
                    location,
                    role: role
                });
                if (!updated) {
                    return res.status(400).json({ message: 'No changes were made' });
                }
                return res.status(200).json({ message: 'User updated successfully' });
            }
            catch (error) {
                console.error('Update user error:', error);
                return res.status(500).json({ message: 'An error occurred while updating user' });
            }
        });
    }
    // Delete user
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = parseInt(req.params.id);
                if (isNaN(userId)) {
                    return res.status(400).json({ message: 'Invalid user ID' });
                }
                // Check if user exists
                const user = yield user_1.default.getById(userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                // Delete user
                const deleted = yield user_1.default.delete(userId);
                if (!deleted) {
                    return res.status(500).json({ message: 'Failed to delete user' });
                }
                return res.status(200).json({ message: 'User deleted successfully' });
            }
            catch (error) {
                console.error('Delete user error:', error);
                return res.status(500).json({ message: 'An error occurred while deleting user' });
            }
        });
    }
    // Get all employees
    getAllEmployees(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const employees = yield user_1.default.getAllEmployees();
                return res.status(200).json({ employees });
            }
            catch (error) {
                console.error('Get all employees error:', error);
                return res.status(500).json({ message: 'An error occurred while getting employees' });
            }
        });
    }
    // Get employees by supervisor ID
    getEmployeesBySupervisor(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supervisorId = parseInt(req.params.id);
                if (isNaN(supervisorId)) {
                    return res.status(400).json({ message: 'Invalid supervisor ID' });
                }
                // Check if supervisor exists
                const supervisor = yield user_1.default.getById(supervisorId);
                if (!supervisor) {
                    return res.status(404).json({ message: 'Supervisor not found' });
                }
                // Get employees
                const employees = yield user_1.default.getEmployeesBySupervisor(supervisorId);
                return res.status(200).json({ employees });
            }
            catch (error) {
                console.error('Get employees by supervisor error:', error);
                return res.status(500).json({ message: 'An error occurred while getting employees' });
            }
        });
    }
    // Assign supervisor to employee
    assignSupervisor(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { employeeId, supervisorId } = req.body;
                if (!employeeId || !supervisorId) {
                    return res.status(400).json({ message: 'Employee ID and supervisor ID are required' });
                }
                // Check if employee exists
                const employee = yield user_1.default.getById(employeeId);
                if (!employee) {
                    return res.status(404).json({ message: 'Employee not found' });
                }
                // Check if supervisor exists
                const supervisor = yield user_1.default.getById(supervisorId);
                if (!supervisor) {
                    return res.status(404).json({ message: 'Supervisor not found' });
                }
                // Check if employee is actually an employee
                if (employee.role !== 'employee') {
                    return res.status(400).json({ message: 'User is not an employee' });
                }
                // Check if supervisor is actually a supervisor or admin
                if (supervisor.role !== 'supervisor' && supervisor.role !== 'admin') {
                    return res.status(400).json({ message: 'User is not a supervisor or admin' });
                }
                // Assign supervisor
                const assigned = yield user_1.default.assignSupervisor(employeeId, supervisorId);
                if (!assigned) {
                    return res.status(500).json({ message: 'Failed to assign supervisor' });
                }
                return res.status(200).json({ message: 'Supervisor assigned successfully' });
            }
            catch (error) {
                console.error('Assign supervisor error:', error);
                return res.status(500).json({ message: 'An error occurred while assigning supervisor' });
            }
        });
    }
    // Get supervisor for employee
    getSupervisorForEmployee(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const employeeId = parseInt(req.params.id);
                if (isNaN(employeeId)) {
                    return res.status(400).json({ message: 'Invalid employee ID' });
                }
                // Check if employee exists
                const employee = yield user_1.default.getById(employeeId);
                if (!employee) {
                    return res.status(404).json({ message: 'Employee not found' });
                }
                // Get supervisor
                const supervisor = yield user_1.default.getSupervisorForEmployee(employeeId);
                if (!supervisor) {
                    return res.status(404).json({ message: 'No supervisor assigned to this employee' });
                }
                return res.status(200).json({ supervisor });
            }
            catch (error) {
                console.error('Get supervisor for employee error:', error);
                return res.status(500).json({ message: 'An error occurred while getting supervisor' });
            }
        });
    }
}
exports.default = new UserController();
