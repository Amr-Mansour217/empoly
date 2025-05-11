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
const report_1 = __importDefault(require("../models/report"));
const user_1 = __importDefault(require("../models/user"));
class DashboardController {
    // Get dashboard data for admin or supervisor
    getDashboardData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
                const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
                let stats;
                let employees;
                if (req.user.role === 'admin') {
                    // Admin can see all stats and employees
                    stats = yield report_1.default.getSummaryStats(startDate, endDate);
                    employees = yield user_1.default.getAllEmployees();
                }
                else if (req.user.role === 'supervisor') {
                    // Supervisor can only see stats and employees they supervise
                    stats = yield report_1.default.getSummaryStats(startDate, endDate, req.user.id);
                    employees = yield user_1.default.getEmployeesBySupervisor(req.user.id);
                }
                else {
                    return res.status(403).json({ message: 'You do not have permission to view dashboard data' });
                }
                // Calculate additional metrics
                const totalEmployees = employees.length;
                const presentPercentage = totalEmployees > 0 ?
                    Math.round((stats.attendance.present / (stats.attendance.present + stats.attendance.absent)) * 100) : 0;
                return res.status(200).json({
                    stats,
                    employees,
                    totalEmployees,
                    presentPercentage
                });
            }
            catch (error) {
                console.error('Get dashboard data error:', error);
                return res.status(500).json({ message: 'An error occurred while getting dashboard data' });
            }
        });
    }
    // Get employee dashboard data
    getEmployeeDashboard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const employeeId = req.user.id;
                // Get current date
                const today = new Date().toISOString().split('T')[0];
                // Get today's report if it exists
                const todayReport = yield report_1.default.getByEmployeeAndDate(employeeId, today);
                // Get supervisor
                const supervisor = yield user_1.default.getSupervisorForEmployee(employeeId);
                // Get recent reports (last 7 days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const startDate = sevenDaysAgo.toISOString().split('T')[0];
                const recentReports = yield report_1.default.getByEmployeeId(employeeId);
                return res.status(200).json({
                    todayReport: todayReport || null,
                    hasSubmittedToday: !!todayReport,
                    supervisor: supervisor || null,
                    recentReports: recentReports.slice(0, 7) // Limit to 7 most recent reports
                });
            }
            catch (error) {
                console.error('Get employee dashboard error:', error);
                return res.status(500).json({ message: 'An error occurred while getting dashboard data' });
            }
        });
    }
}
exports.default = new DashboardController();
