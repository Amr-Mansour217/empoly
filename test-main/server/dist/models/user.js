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
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserModel {
    // Create a new user
    create(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password, full_name, phone, nationality, location, role } = userData;
            // Hash password
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(password, salt);
            try {
                const [result] = yield db_1.pool.execute('INSERT INTO users (username, password, full_name, phone, nationality, location, role) VALUES (?, ?, ?, ?, ?, ?, ?)', [username, hashedPassword, full_name, phone || null, nationality || null, location || null, role]);
                return (result === null || result === void 0 ? void 0 : result.insertId) || 0;
            }
            catch (error) {
                console.error('Error creating user:', error);
                throw error;
            }
        });
    }
    // Get user by ID
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [rows] = yield db_1.pool.execute('SELECT id, username, full_name, phone, nationality, location, role, created_at, updated_at FROM users WHERE id = ?', [id]);
                return rows && rows.length ? rows[0] : null;
            }
            catch (error) {
                console.error('Error getting user by ID:', error);
                throw error;
            }
        });
    }
    // Get user by username (for authentication)
    getByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [rows] = yield db_1.pool.execute('SELECT * FROM users WHERE username = ?', [username]);
                return rows && rows.length ? rows[0] : null;
            }
            catch (error) {
                console.error('Error getting user by username:', error);
                throw error;
            }
        });
    }
    // Update user
    update(id, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const allowedFields = ['full_name', 'phone', 'nationality', 'location', 'role'];
                const updates = [];
                const values = [];
                // Build dynamic update query
                Object.entries(userData).forEach(([key, value]) => {
                    if (allowedFields.includes(key) && value !== undefined) {
                        updates.push(`${key} = ?`);
                        values.push(value);
                    }
                });
                // If password is being updated, hash it
                if (userData.password) {
                    const salt = yield bcrypt_1.default.genSalt(10);
                    const hashedPassword = yield bcrypt_1.default.hash(userData.password, salt);
                    updates.push('password = ?');
                    values.push(hashedPassword);
                }
                if (updates.length === 0)
                    return false;
                // Add ID to values array
                values.push(id);
                const [result] = yield db_1.pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
                return result && result.affectedRows > 0;
            }
            catch (error) {
                console.error('Error updating user:', error);
                throw error;
            }
        });
    }
    // Delete user
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Attempting to delete user with ID: ${id}`);
                // Begin transaction to ensure data consistency
                yield db_1.pool.execute('START TRANSACTION');
                try {
                    // 1. First remove any supervisor assignments where this user is an employee
                    console.log(`Removing employee-supervisor records where employee_id = ${id}`);
                    yield db_1.pool.execute('DELETE FROM employee_supervisors WHERE employee_id = ?', [id]);
                    // 2. Then remove any supervisor assignments where this user is a supervisor
                    console.log(`Removing employee-supervisor records where supervisor_id = ${id}`);
                    yield db_1.pool.execute('DELETE FROM employee_supervisors WHERE supervisor_id = ?', [id]);
                    // 3. Finally delete the user
                    console.log(`Deleting user from users table with id = ${id}`);
                    const [result] = yield db_1.pool.execute('DELETE FROM users WHERE id = ?', [id]);
                    // Commit the transaction if everything succeeded
                    yield db_1.pool.execute('COMMIT');
                    console.log(`User deletion result: ${JSON.stringify(result)}`);
                    return result && result.affectedRows > 0;
                }
                catch (transactionError) {
                    // Rollback on error
                    console.error('Error in delete transaction, rolling back:', transactionError);
                    yield db_1.pool.execute('ROLLBACK');
                    throw transactionError;
                }
            }
            catch (error) {
                console.error('Error deleting user:', error);
                throw error;
            }
        });
    }
    // Get all users
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [rows] = yield db_1.pool.execute('SELECT id, username, full_name, phone, nationality, location, role, created_at, updated_at FROM users');
                return rows || [];
            }
            catch (error) {
                console.error('Error getting all users:', error);
                throw error;
            }
        });
    }
    // Get all employees
    getAllEmployees() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [rows] = yield db_1.pool.execute('SELECT id, username, full_name, phone, nationality, location, role, created_at, updated_at FROM users WHERE role = "employee"');
                return rows || [];
            }
            catch (error) {
                console.error('Error getting all employees:', error);
                throw error;
            }
        });
    }
    // Get all supervisors
    getAllSupervisors() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [rows] = yield db_1.pool.execute('SELECT id, username, full_name, phone, nationality, location, role, created_at, updated_at FROM users WHERE role = "supervisor" OR role = "admin"');
                return rows || [];
            }
            catch (error) {
                console.error('Error getting all supervisors:', error);
                throw error;
            }
        });
    }
    // Get employees by supervisor ID
    getEmployeesBySupervisor(supervisorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [rows] = yield db_1.pool.execute(`SELECT u.id, u.username, u.full_name, u.phone, u.nationality, u.location, u.role, u.created_at, u.updated_at 
         FROM users u
         JOIN employee_supervisors es ON u.id = es.employee_id
         WHERE es.supervisor_id = ?`, [supervisorId]);
                return rows || [];
            }
            catch (error) {
                console.error('Error getting employees by supervisor:', error);
                throw error;
            }
        });
    }
    // Assign supervisor to employee
    assignSupervisor(employeeId, supervisorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if the employee already has a supervisor
                const [existing] = yield db_1.pool.execute('SELECT * FROM employee_supervisors WHERE employee_id = ?', [employeeId]);
                if (existing && existing.length > 0) {
                    // Update existing relationship
                    const [result] = yield db_1.pool.execute('UPDATE employee_supervisors SET supervisor_id = ? WHERE employee_id = ?', [supervisorId, employeeId]);
                    return result && result.affectedRows > 0;
                }
                else {
                    // Create new relationship
                    const [result] = yield db_1.pool.execute('INSERT INTO employee_supervisors (employee_id, supervisor_id) VALUES (?, ?)', [employeeId, supervisorId]);
                    return result && result.affectedRows > 0;
                }
            }
            catch (error) {
                console.error('Error assigning supervisor:', error);
                return false;
            }
        });
    }
    // Get supervisor for employee
    getSupervisorForEmployee(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [rows] = yield db_1.pool.execute(`SELECT u.id, u.username, u.full_name, u.phone, u.nationality, u.location, u.role, u.created_at, u.updated_at 
         FROM users u
         JOIN employee_supervisors es ON u.id = es.supervisor_id
         WHERE es.employee_id = ?`, [employeeId]);
                return rows && rows.length ? rows[0] : null;
            }
            catch (error) {
                console.error('Error getting supervisor for employee:', error);
                throw error;
            }
        });
    }
}
exports.default = new UserModel();
