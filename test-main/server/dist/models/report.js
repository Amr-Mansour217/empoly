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
class ReportModel {
    // Create a new report
    create(reportData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { employee_id, activity_type_id, beneficiaries_count, location, report_date } = reportData;
            // Check if report already exists for this date and employee
            const [existing] = yield db_1.pool.execute('SELECT * FROM daily_reports WHERE employee_id = ? AND report_date = ?', [employee_id, report_date]);
            if (existing.length > 0) {
                // Update existing report
                yield db_1.pool.execute('UPDATE daily_reports SET activity_type_id = ?, beneficiaries_count = ?, location = ?, submitted_at = NOW() WHERE employee_id = ? AND report_date = ?', [activity_type_id, beneficiaries_count, location || null, employee_id, report_date]);
                return existing[0].id;
            }
            // Create new report
            const [result] = yield db_1.pool.execute('INSERT INTO daily_reports (employee_id, activity_type_id, beneficiaries_count, location, report_date) VALUES (?, ?, ?, ?, ?)', [employee_id, activity_type_id, beneficiaries_count, location || null, report_date]);
            // Mark attendance as present
            yield this.markAttendance(employee_id, report_date, 'present');
            return result.insertId;
        });
    }
    // Get report by ID
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.pool.execute(`SELECT dr.*, u.full_name, at.name as activity_name 
       FROM daily_reports dr
       JOIN users u ON dr.employee_id = u.id
       JOIN activity_types at ON dr.activity_type_id = at.id
       WHERE dr.id = ?`, [id]);
            return rows.length ? rows[0] : null;
        });
    }
    // Get reports by employee ID
    getByEmployeeId(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.pool.execute(`SELECT dr.*, at.name as activity_name 
       FROM daily_reports dr
       JOIN activity_types at ON dr.activity_type_id = at.id
       WHERE dr.employee_id = ?
       ORDER BY dr.report_date DESC`, [employeeId]);
            return rows;
        });
    }
    // Get report by employee ID and date
    getByEmployeeAndDate(employeeId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.pool.execute('SELECT * FROM daily_reports WHERE employee_id = ? AND report_date = ?', [employeeId, date]);
            return rows.length ? rows[0] : null;
        });
    }
    // Get detailed report by employee ID and date with activities breakdown
    getDetailedReportByEmployeeAndDate(employeeId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // الحصول على التقرير الأساسي
                const [report] = yield db_1.pool.execute(`SELECT dr.*, u.full_name, at.name as activity_name 
         FROM daily_reports dr
         JOIN users u ON dr.employee_id = u.id
         JOIN activity_types at ON dr.activity_type_id = at.id
         WHERE dr.employee_id = ? AND dr.report_date = ?`, [employeeId, date]);
                if (!report || report.length === 0) {
                    return null;
                }
                // إضافة معلومات تفصيلية للأنشطة (مستوحاة من البيانات المستخدمة في واجهة المستخدم)
                const reportDetails = report[0];
                // إضافة أنشطة مفصلة
                reportDetails.activities = [
                    {
                        name: "الدرس الأول",
                        beneficiaries_count: reportDetails.lesson1_beneficiaries || 0,
                        execution_time: reportDetails.lesson1_time || "00:00"
                    },
                    {
                        name: "الدرس الثاني",
                        beneficiaries_count: reportDetails.lesson2_beneficiaries || 0,
                        execution_time: reportDetails.lesson2_time || "00:00"
                    },
                    {
                        name: "حلقة التلاوة",
                        beneficiaries_count: reportDetails.quran_session_beneficiaries || 0,
                        execution_time: reportDetails.quran_session_time || "00:00"
                    }
                ];
                return reportDetails;
            }
            catch (error) {
                console.error('Error getting detailed report:', error);
                return null;
            }
        });
    }
    // Get all reports - modified to include all employees
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get current date
            const today = new Date().toISOString().split('T')[0];
            // Use LEFT JOIN to include all employees, even those without reports
            const [rows] = yield db_1.pool.execute(`SELECT 
         IFNULL(dr.id, 0) as id,
         u.id as employee_id,
         u.full_name,
         dr.activity_type_id,
         dr.beneficiaries_count,
         dr.location,
         IFNULL(dr.report_date, ?) as report_date,
         dr.submitted_at,
         at.name as activity_name,
         CASE WHEN dr.id IS NOT NULL THEN 1 ELSE 0 END as has_submitted
       FROM users u
       LEFT JOIN daily_reports dr ON u.id = dr.employee_id AND dr.report_date = ?
       LEFT JOIN activity_types at ON dr.activity_type_id = at.id
       WHERE u.role = 'employee'
       ORDER BY u.full_name ASC`, [today, today]);
            return rows;
        });
    }
    // Get reports by supervisor ID - modified to include all employees
    getBySupervisorId(supervisorId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get current date
            const today = new Date().toISOString().split('T')[0];
            // Use LEFT JOIN to include all employees assigned to this supervisor, even without reports
            const [rows] = yield db_1.pool.execute(`SELECT 
         IFNULL(dr.id, 0) as id,
         u.id as employee_id,
         u.full_name,
         dr.activity_type_id,
         dr.beneficiaries_count,
         dr.location,
         IFNULL(dr.report_date, ?) as report_date,
         dr.submitted_at,
         at.name as activity_name,
         CASE WHEN dr.id IS NOT NULL THEN 1 ELSE 0 END as has_submitted
       FROM users u
       JOIN employee_supervisors es ON u.id = es.employee_id
       LEFT JOIN daily_reports dr ON u.id = dr.employee_id AND dr.report_date = ?
       LEFT JOIN activity_types at ON dr.activity_type_id = at.id
       WHERE es.supervisor_id = ? AND u.role = 'employee'
       ORDER BY u.full_name ASC`, [today, today, supervisorId]);
            return rows;
        });
    }
    // Get reports by date range - modified to include all employees
    getByDateRange(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            // For report ranges, we'll focus on the endDate (typically today)
            // This ensures we show current employee status for the selected period
            // Use LEFT JOIN to include all employees, even those without reports
            const [rows] = yield db_1.pool.execute(`SELECT 
         IFNULL(dr.id, 0) as id,
         u.id as employee_id,
         u.full_name,
         dr.activity_type_id,
         dr.beneficiaries_count,
         dr.location,
         IFNULL(dr.report_date, ?) as report_date,
         dr.submitted_at,
         at.name as activity_name,
         CASE WHEN dr.id IS NOT NULL THEN 1 ELSE 0 END as has_submitted
       FROM users u
       LEFT JOIN (
         SELECT * FROM daily_reports 
         WHERE report_date BETWEEN ? AND ?
       ) dr ON u.id = dr.employee_id AND dr.report_date = ?
       LEFT JOIN activity_types at ON dr.activity_type_id = at.id
       WHERE u.role = 'employee'
       ORDER BY u.full_name ASC, dr.report_date DESC`, [endDate, startDate, endDate, endDate]);
            return rows;
        });
    }
    // Get reports by supervisor ID and date range - modified to include all employees
    getBySupervisorAndDateRange(supervisorId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            // Use LEFT JOIN to include all employees assigned to this supervisor, even those without reports
            const [rows] = yield db_1.pool.execute(`SELECT 
         IFNULL(dr.id, 0) as id,
         u.id as employee_id,
         u.full_name,
         dr.activity_type_id,
         dr.beneficiaries_count,
         dr.location,
         IFNULL(dr.report_date, ?) as report_date,
         dr.submitted_at,
         at.name as activity_name,
         CASE WHEN dr.id IS NOT NULL THEN 1 ELSE 0 END as has_submitted
       FROM users u
       JOIN employee_supervisors es ON u.id = es.employee_id
       LEFT JOIN (
         SELECT * FROM daily_reports 
         WHERE report_date BETWEEN ? AND ?
       ) dr ON u.id = dr.employee_id AND dr.report_date = ?
       LEFT JOIN activity_types at ON dr.activity_type_id = at.id
       WHERE es.supervisor_id = ? AND u.role = 'employee'
       ORDER BY u.full_name ASC, dr.report_date DESC`, [endDate, startDate, endDate, endDate, supervisorId]);
            return rows;
        });
    }
    // Mark attendance
    markAttendance(employeeId, date, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if attendance record already exists
                const [existing] = yield db_1.pool.execute('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employeeId, date]);
                if (existing.length > 0) {
                    // Update existing record
                    const [result] = yield db_1.pool.execute('UPDATE attendance SET status = ? WHERE employee_id = ? AND date = ?', [status, employeeId, date]);
                    return result.affectedRows > 0;
                }
                else {
                    // Create new record
                    const [result] = yield db_1.pool.execute('INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)', [employeeId, date, status]);
                    return result.affectedRows > 0;
                }
            }
            catch (error) {
                console.error('Error marking attendance:', error);
                return false;
            }
        });
    }
    // Mark absent for all employees who didn't submit a report for a specific date
    markAbsentForMissingReports(date) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all employees
                const [employees] = yield db_1.pool.execute('SELECT id FROM users WHERE role = "employee"');
                let absentCount = 0;
                // For each employee, check if they submitted a report
                for (const employee of employees) {
                    const [report] = yield db_1.pool.execute('SELECT * FROM daily_reports WHERE employee_id = ? AND report_date = ?', [employee.id, date]);
                    // If no report, mark as absent
                    if (report.length === 0) {
                        yield this.markAttendance(employee.id, date, 'absent');
                        absentCount++;
                    }
                }
                return absentCount;
            }
            catch (error) {
                console.error('Error marking absent for missing reports:', error);
                return 0;
            }
        });
    }
    // Get summary statistics for reports
    getSummaryStats(startDate, endDate, supervisorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let employeeQuery = '';
                let queryParams = [startDate, endDate];
                if (supervisorId) {
                    employeeQuery = 'JOIN employee_supervisors es ON u.id = es.employee_id WHERE es.supervisor_id = ?';
                    queryParams.push(supervisorId.toString());
                }
                // Get present count
                const [presentResult] = yield db_1.pool.execute(`SELECT COUNT(*) as count FROM attendance a 
         JOIN users u ON a.employee_id = u.id
         ${employeeQuery}
         AND a.date BETWEEN ? AND ? AND a.status = 'present'`, queryParams);
                // Get absent count
                const [absentResult] = yield db_1.pool.execute(`SELECT COUNT(*) as count FROM attendance a 
         JOIN users u ON a.employee_id = u.id
         ${employeeQuery}
         AND a.date BETWEEN ? AND ? AND a.status = 'absent'`, queryParams);
                // Get total beneficiaries
                const [beneficiariesResult] = yield db_1.pool.execute(`SELECT SUM(beneficiaries_count) as total FROM daily_reports dr
         JOIN users u ON dr.employee_id = u.id
         ${employeeQuery}
         AND dr.report_date BETWEEN ? AND ?`, queryParams);
                // Get activities breakdown
                const [activitiesResult] = yield db_1.pool.execute(`SELECT at.name, COUNT(*) as count, SUM(dr.beneficiaries_count) as beneficiaries
         FROM daily_reports dr
         JOIN activity_types at ON dr.activity_type_id = at.id
         JOIN users u ON dr.employee_id = u.id
         ${employeeQuery}
         AND dr.report_date BETWEEN ? AND ?
         GROUP BY at.name`, queryParams);
                return {
                    attendance: {
                        present: presentResult[0].count,
                        absent: absentResult[0].count
                    },
                    totalBeneficiaries: beneficiariesResult[0].total || 0,
                    activitiesBreakdown: activitiesResult
                };
            }
            catch (error) {
                console.error('Error getting summary stats:', error);
                return {
                    attendance: { present: 0, absent: 0 },
                    totalBeneficiaries: 0,
                    activitiesBreakdown: []
                };
            }
        });
    }
}
exports.default = new ReportModel();
