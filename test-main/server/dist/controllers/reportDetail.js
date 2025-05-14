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
const db_1 = require("../config/db");
class ReportDetailController {
    // Get report details by employee ID and date
    getReportByEmployeeAndDate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const employeeId = parseInt(req.params.employeeId);
                const date = req.params.date;
                if (isNaN(employeeId) || !date) {
                    return res.status(400).json({ message: 'Invalid employee ID or date' });
                }
                // Check if user has permission to view this report
                if (req.user.role === 'employee' && employeeId !== req.user.id) {
                    return res.status(403).json({ message: 'You do not have permission to view this report' });
                }
                // Get the report with all details
                const [rows] = yield db_1.pool.execute(`SELECT dr.*, u.full_name, at.name as activity_name 
         FROM daily_reports dr
         JOIN users u ON dr.employee_id = u.id
         JOIN activity_types at ON dr.activity_type_id = at.id
         WHERE dr.employee_id = ? AND dr.report_date = ?`, [employeeId, date]);
                if (rows.length === 0) {
                    return res.status(404).json({ message: 'Report not found' });
                }
                return res.status(200).json({ report: rows[0] });
            }
            catch (error) {
                console.error('Error getting report by employee and date:', error);
                return res.status(500).json({ message: 'An error occurred while getting the report' });
            }
        });
    }
}
exports.default = new ReportDetailController();
