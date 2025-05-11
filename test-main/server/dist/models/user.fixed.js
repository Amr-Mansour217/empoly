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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Fixed User Model with improved error handling for supervisor assignment
 */
const db_1 = require("../config/db");
class FixedUserModel {
    // Get all supervisors with improved error handling
    getAllSupervisors() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[FIXED] Getting all supervisors...');
                const [rows] = yield db_1.pool.execute('SELECT id, username, full_name, phone, nationality, location, role, created_at, updated_at FROM users WHERE role = "supervisor" OR role = "admin"');
                // Log supervisor count for debugging
                console.log(`[FIXED] Found ${(rows === null || rows === void 0 ? void 0 : rows.length) || 0} supervisors in database`);
                // Always return an array, even if empty
                return rows || [];
            }
            catch (error) {
                console.error('[FIXED] Error getting all supervisors:', error);
                // Instead of throwing error, return empty array for better error handling
                console.log('[FIXED] Returning empty array instead of throwing error');
                return [];
            }
        });
    }
    // Assign supervisor to employee with improved validation and error handling
    assignSupervisor(employeeId, supervisorId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[FIXED] Assigning supervisor ${supervisorId} to employee ${employeeId}`);
            if (!employeeId || !supervisorId) {
                console.error('[FIXED] Invalid employee or supervisor ID');
                return false;
            }
            if (isNaN(employeeId) || isNaN(supervisorId)) {
                console.error('[FIXED] Employee or supervisor ID is not a number');
                return false;
            }
            // Prevent self-assignment
            if (employeeId === supervisorId) {
                console.error('[FIXED] Employee cannot be their own supervisor');
                return false;
            }
            try {
                // Verify the employee exists and is actually an employee
                const [employeeRows] = yield db_1.pool.execute('SELECT id, role FROM users WHERE id = ?', [employeeId]);
                if (!employeeRows || employeeRows.length === 0) {
                    console.error(`[FIXED] Employee with ID ${employeeId} not found`);
                    return false;
                }
                const employee = employeeRows[0];
                if (employee.role !== 'employee') {
                    console.error(`[FIXED] User with ID ${employeeId} is not an employee (role: ${employee.role})`);
                    return false;
                }
                // Verify the supervisor exists and is actually a supervisor or admin
                const [supervisorRows] = yield db_1.pool.execute('SELECT id, role FROM users WHERE id = ?', [supervisorId]);
                if (!supervisorRows || supervisorRows.length === 0) {
                    console.error(`[FIXED] Supervisor with ID ${supervisorId} not found`);
                    return false;
                }
                const supervisor = supervisorRows[0];
                if (supervisor.role !== 'supervisor' && supervisor.role !== 'admin') {
                    console.error(`[FIXED] User with ID ${supervisorId} is not a supervisor or admin (role: ${supervisor.role})`);
                    return false;
                }
                // Check if the employee already has a supervisor
                const [existing] = yield db_1.pool.execute('SELECT * FROM employee_supervisors WHERE employee_id = ?', [employeeId]);
                let result;
                if (existing && existing.length > 0) {
                    console.log(`[FIXED] Employee ${employeeId} already has a supervisor. Updating...`);
                    // Update existing relationship
                    [result] = yield db_1.pool.execute('UPDATE employee_supervisors SET supervisor_id = ? WHERE employee_id = ?', [supervisorId, employeeId]);
                }
                else {
                    console.log(`[FIXED] Creating new supervisor assignment for employee ${employeeId}`);
                    // Create new relationship
                    [result] = yield db_1.pool.execute('INSERT INTO employee_supervisors (employee_id, supervisor_id) VALUES (?, ?)', [employeeId, supervisorId]);
                }
                const success = result && result.affectedRows > 0;
                if (success) {
                    console.log(`[FIXED] Successfully assigned supervisor ${supervisorId} to employee ${employeeId}`);
                }
                else {
                    console.error('[FIXED] Database operation completed but no rows were affected');
                }
                return success;
            }
            catch (error) {
                console.error('[FIXED] Error assigning supervisor:', error);
                return false;
            }
        });
    }
    // Get supervisor for employee with improved error handling
    getSupervisorForEmployee(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!employeeId || isNaN(employeeId)) {
                    console.error('[FIXED] Invalid employee ID');
                    return null;
                }
                const [rows] = yield db_1.pool.execute(`SELECT u.id, u.username, u.full_name, u.phone, u.nationality, u.location, u.role, u.created_at, u.updated_at 
         FROM users u
         JOIN employee_supervisors es ON u.id = es.supervisor_id
         WHERE es.employee_id = ?`, [employeeId]);
                if (!rows || rows.length === 0) {
                    console.log(`[FIXED] No supervisor found for employee ${employeeId}`);
                    return null;
                }
                console.log(`[FIXED] Found supervisor for employee ${employeeId}: ${rows[0].full_name}`);
                return rows[0];
            }
            catch (error) {
                console.error('[FIXED] Error getting supervisor for employee:', error);
                return null;
            }
        });
    }
}
// Export a singleton instance
exports.default = new FixedUserModel();
