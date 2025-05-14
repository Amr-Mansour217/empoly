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
class ReportController {
    // Create a new report
    createReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { activity_type_id, beneficiaries_count, location } = req.body;
                const employee_id = req.user.id;
                // Get current date in YYYY-MM-DD format
                const today = new Date().toISOString().split('T')[0];
                // Validate input
                if (!activity_type_id || !beneficiaries_count) {
                    return res.status(400).json({ message: 'Activity type and beneficiaries count are required' });
                }
                // Create report
                const reportId = yield report_1.default.create({
                    employee_id,
                    activity_type_id,
                    beneficiaries_count,
                    location,
                    report_date: today
                });
                return res.status(201).json({
                    message: 'Report submitted successfully',
                    reportId
                });
            }
            catch (error) {
                console.error('Create report error:', error);
                return res.status(500).json({ message: 'An error occurred while submitting report' });
            }
        });
    }
    // Get report by ID
    getReportById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reportId = parseInt(req.params.id);
                if (isNaN(reportId)) {
                    return res.status(400).json({ message: 'Invalid report ID' });
                }
                const report = yield report_1.default.getById(reportId);
                if (!report) {
                    return res.status(404).json({ message: 'Report not found' });
                }
                // Check if user has permission to view this report
                if (req.user.role === 'employee' && report.employee_id !== req.user.id) {
                    return res.status(403).json({ message: 'You do not have permission to view this report' });
                }
                return res.status(200).json({ report });
            }
            catch (error) {
                console.error('Get report by ID error:', error);
                return res.status(500).json({ message: 'An error occurred while getting report' });
            }
        });
    }
    // Get reports by employee ID
    getReportsByEmployeeId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const employeeId = parseInt(req.params.id);
                if (isNaN(employeeId)) {
                    return res.status(400).json({ message: 'Invalid employee ID' });
                }
                // Check if user has permission to view these reports
                if (req.user.role === 'employee' && employeeId !== req.user.id) {
                    return res.status(403).json({ message: 'You do not have permission to view these reports' });
                }
                const reports = yield report_1.default.getByEmployeeId(employeeId);
                return res.status(200).json({ reports });
            }
            catch (error) {
                console.error('Get reports by employee ID error:', error);
                return res.status(500).json({ message: 'An error occurred while getting reports' });
            }
        });
    }
    // Get detailed report info by employee ID
    getEmployeeReportDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const employeeId = parseInt(req.params.id);
                const reportDate = req.query.report_date || new Date().toISOString().split('T')[0];
                if (isNaN(employeeId)) {
                    return res.status(400).json({ message: 'Invalid employee ID' });
                }
                // Check if user has permission to view these reports
                if (req.user.role === 'employee' && employeeId !== req.user.id) {
                    return res.status(403).json({ message: 'You do not have permission to view these report details' });
                }
                // Get report with detailed activity breakdown
                const report = yield report_1.default.getDetailedReportByEmployeeAndDate(employeeId, reportDate);
                console.log(`Debug - Employee report details for ${employeeId} on ${reportDate}:`, report);
                if (!report) {
                    console.log(`Debug - No report found for employee ${employeeId} on ${reportDate}`);
                    return res.status(404).json({ message: 'Report details not found' });
                }
                // Enviar la respuesta en el formato que espera el cliente (array 'reports')
                console.log(`Debug - Sending report details:`, { reports: [report] });
                return res.status(200).json({ reports: [report] });
            }
            catch (error) {
                console.error('Get employee report details error:', error);
                return res.status(500).json({ message: 'An error occurred while getting report details' });
            }
        });
    }
    // Get report for current employee and date
    getCurrentEmployeeReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const employeeId = req.user.id;
                const date = req.query.date || new Date().toISOString().split('T')[0];
                const report = yield report_1.default.getByEmployeeAndDate(employeeId, date);
                return res.status(200).json({
                    report: report || null,
                    hasSubmitted: !!report
                });
            }
            catch (error) {
                console.error('Get current employee report error:', error);
                return res.status(500).json({ message: 'An error occurred while getting report' });
            }
        });
    }
    // Get all reports (admin/supervisor)
    getAllReports(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Filter by date range if provided
                const startDate = req.query.startDate;
                const endDate = req.query.endDate;
                const supervisorId = req.query.supervisorId ? parseInt(req.query.supervisorId) : null;
                let reports;
                if (req.user.role === 'admin') {
                    // Admin can see all reports or filter by supervisor
                    if (supervisorId) {
                        // Admin requesting reports for a specific supervisor's employees
                        if (startDate && endDate) {
                            reports = yield report_1.default.getBySupervisorAndDateRange(supervisorId, startDate, endDate);
                        }
                        else {
                            reports = yield report_1.default.getBySupervisorId(supervisorId);
                        }
                    }
                    else {
                        // Admin requesting all reports
                        if (startDate && endDate) {
                            reports = yield report_1.default.getByDateRange(startDate, endDate);
                        }
                        else {
                            reports = yield report_1.default.getAll();
                        }
                    }
                }
                else if (req.user.role === 'supervisor') {
                    // Supervisor can only see reports from their employees
                    if (startDate && endDate) {
                        reports = yield report_1.default.getBySupervisorAndDateRange(req.user.id, startDate, endDate);
                    }
                    else {
                        reports = yield report_1.default.getBySupervisorId(req.user.id);
                    }
                }
                else {
                    return res.status(403).json({ message: 'You do not have permission to view all reports' });
                }
                return res.status(200).json({ reports });
            }
            catch (error) {
                console.error('Get all reports error:', error);
                return res.status(500).json({ message: 'An error occurred while getting reports' });
            }
        });
    }
    // Get summary statistics
    getSummaryStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
                const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
                let stats;
                if (req.user.role === 'admin') {
                    // Admin can see all stats
                    stats = yield report_1.default.getSummaryStats(startDate, endDate);
                }
                else if (req.user.role === 'supervisor') {
                    // Supervisor can only see stats from their employees
                    stats = yield report_1.default.getSummaryStats(startDate, endDate, req.user.id);
                }
                else {
                    return res.status(403).json({ message: 'You do not have permission to view summary statistics' });
                }
                return res.status(200).json({ stats });
            }
            catch (error) {
                console.error('Get summary stats error:', error);
                return res.status(500).json({ message: 'An error occurred while getting statistics' });
            }
        });
    }
}
exports.default = new ReportController();
