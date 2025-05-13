import { pool } from '../config/db';

interface Report {
  id?: number;
  employee_id: number;
  activity_type_id: number;
  beneficiaries_count: number;
  location?: string;
  report_date: string; // YYYY-MM-DD format
  submitted_at?: Date;
}

interface ReportWithDetails extends Report {
  full_name?: string;
  activity_name?: string;
}

class ReportModel {
  // Create a new report
  async create(reportData: Report): Promise<number> {
    const { employee_id, activity_type_id, beneficiaries_count, location, report_date } = reportData;
    
    // Check if report already exists for this date and employee
    const [existing]: any = await pool.execute(
      'SELECT * FROM daily_reports WHERE employee_id = ? AND report_date = ?',
      [employee_id, report_date]
    );
    
    if (existing.length > 0) {
      // Update existing report
      await pool.execute(
        'UPDATE daily_reports SET activity_type_id = ?, beneficiaries_count = ?, location = ?, submitted_at = NOW() WHERE employee_id = ? AND report_date = ?',
        [activity_type_id, beneficiaries_count, location || null, employee_id, report_date]
      );
      return existing[0].id;
    }
    
    // Create new report
    const [result]: any = await pool.execute(
      'INSERT INTO daily_reports (employee_id, activity_type_id, beneficiaries_count, location, report_date) VALUES (?, ?, ?, ?, ?)',
      [employee_id, activity_type_id, beneficiaries_count, location || null, report_date]
    );
    
    // Mark attendance as present
    await this.markAttendance(employee_id, report_date, 'present');
    
    return result.insertId;
  }
  
  // Get report by ID
  async getById(id: number): Promise<ReportWithDetails | null> {
    const [rows]: any = await pool.execute(
      `SELECT dr.*, u.full_name, at.name as activity_name 
       FROM daily_reports dr
       JOIN users u ON dr.employee_id = u.id
       JOIN activity_types at ON dr.activity_type_id = at.id
       WHERE dr.id = ?`,
      [id]
    );
    
    return rows.length ? rows[0] : null;
  }
  
  // Get reports by employee ID
  async getByEmployeeId(employeeId: number): Promise<ReportWithDetails[]> {
    const [rows]: any = await pool.execute(
      `SELECT dr.*, at.name as activity_name 
       FROM daily_reports dr
       JOIN activity_types at ON dr.activity_type_id = at.id
       WHERE dr.employee_id = ?
       ORDER BY dr.report_date DESC`,
      [employeeId]
    );
    
    return rows;
  }
  
  // Get report by employee ID and date
  async getByEmployeeAndDate(employeeId: number, date: string): Promise<Report | null> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM daily_reports WHERE employee_id = ? AND report_date = ?',
      [employeeId, date]
    );
    
    return rows.length ? rows[0] : null;
  }
  
  // Get all reports - modified to include all employees
  async getAll(): Promise<ReportWithDetails[]> {
    // Get current date
    const today = new Date().toISOString().split('T')[0];

    // Use LEFT JOIN to include all employees, even those without reports
    const [rows]: any = await pool.execute(
      `SELECT 
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
       ORDER BY u.full_name ASC`,
      [today, today]
    );
    
    return rows;
  }
  
  // Get reports by supervisor ID - modified to include all employees
  async getBySupervisorId(supervisorId: number): Promise<ReportWithDetails[]> {
    // Get current date
    const today = new Date().toISOString().split('T')[0];

    // Use LEFT JOIN to include all employees assigned to this supervisor, even without reports
    const [rows]: any = await pool.execute(
      `SELECT 
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
       ORDER BY u.full_name ASC`,
      [today, today, supervisorId]
    );
    
    return rows;
  }
  
  // Get reports by date range - modified to include all employees
  async getByDateRange(startDate: string, endDate: string): Promise<ReportWithDetails[]> {
    // For report ranges, we'll focus on the endDate (typically today)
    // This ensures we show current employee status for the selected period

    // Use LEFT JOIN to include all employees, even those without reports
    const [rows]: any = await pool.execute(
      `SELECT 
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
       ORDER BY u.full_name ASC, dr.report_date DESC`,
      [endDate, startDate, endDate, endDate]
    );
    
    return rows;
  }
  
  // Get reports by supervisor ID and date range - modified to include all employees
  async getBySupervisorAndDateRange(supervisorId: number, startDate: string, endDate: string): Promise<ReportWithDetails[]> {
    // Use LEFT JOIN to include all employees assigned to this supervisor, even those without reports
    const [rows]: any = await pool.execute(
      `SELECT 
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
       ORDER BY u.full_name ASC, dr.report_date DESC`,
      [endDate, startDate, endDate, endDate, supervisorId]
    );
    
    return rows;
  }
  
  // Mark attendance
  async markAttendance(employeeId: number, date: string, status: 'present' | 'absent'): Promise<boolean> {
    try {
      // Check if attendance record already exists
      const [existing]: any = await pool.execute(
        'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
        [employeeId, date]
      );
      
      if (existing.length > 0) {
        // Update existing record
        const [result]: any = await pool.execute(
          'UPDATE attendance SET status = ? WHERE employee_id = ? AND date = ?',
          [status, employeeId, date]
        );
        return result.affectedRows > 0;
      } else {
        // Create new record
        const [result]: any = await pool.execute(
          'INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)',
          [employeeId, date, status]
        );
        return result.affectedRows > 0;
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      return false;
    }
  }
  
  // Mark absent for all employees who didn't submit a report for a specific date
  async markAbsentForMissingReports(date: string): Promise<number> {
    try {
      // Get all employees
      const [employees]: any = await pool.execute(
        'SELECT id FROM users WHERE role = "employee"'
      );
      
      let absentCount = 0;
      
      // For each employee, check if they submitted a report
      for (const employee of employees) {
        const [report]: any = await pool.execute(
          'SELECT * FROM daily_reports WHERE employee_id = ? AND report_date = ?',
          [employee.id, date]
        );
        
        // If no report, mark as absent
        if (report.length === 0) {
          await this.markAttendance(employee.id, date, 'absent');
          absentCount++;
        }
      }
      
      return absentCount;
    } catch (error) {
      console.error('Error marking absent for missing reports:', error);
      return 0;
    }
  }
  
  // Get summary statistics for reports
  async getSummaryStats(startDate: string, endDate: string, supervisorId?: number): Promise<any> {
    try {
      let employeeQuery = '';
      let queryParams = [startDate, endDate];
      
      if (supervisorId) {
        employeeQuery = 'JOIN employee_supervisors es ON u.id = es.employee_id WHERE es.supervisor_id = ?';
        queryParams.push(supervisorId.toString());
      }
      
      // Get present count
      const [presentResult]: any = await pool.execute(
        `SELECT COUNT(*) as count FROM attendance a 
         JOIN users u ON a.employee_id = u.id
         ${employeeQuery}
         AND a.date BETWEEN ? AND ? AND a.status = 'present'`,
        queryParams
      );
      
      // Get absent count
      const [absentResult]: any = await pool.execute(
        `SELECT COUNT(*) as count FROM attendance a 
         JOIN users u ON a.employee_id = u.id
         ${employeeQuery}
         AND a.date BETWEEN ? AND ? AND a.status = 'absent'`,
        queryParams
      );
      
      // Get total beneficiaries
      const [beneficiariesResult]: any = await pool.execute(
        `SELECT SUM(beneficiaries_count) as total FROM daily_reports dr
         JOIN users u ON dr.employee_id = u.id
         ${employeeQuery}
         AND dr.report_date BETWEEN ? AND ?`,
        queryParams
      );
      
      // Get activities breakdown
      const [activitiesResult]: any = await pool.execute(
        `SELECT at.name, COUNT(*) as count, SUM(dr.beneficiaries_count) as beneficiaries
         FROM daily_reports dr
         JOIN activity_types at ON dr.activity_type_id = at.id
         JOIN users u ON dr.employee_id = u.id
         ${employeeQuery}
         AND dr.report_date BETWEEN ? AND ?
         GROUP BY at.name`,
        queryParams
      );
      
      return {
        attendance: {
          present: presentResult[0].count,
          absent: absentResult[0].count
        },
        totalBeneficiaries: beneficiariesResult[0].total || 0,
        activitiesBreakdown: activitiesResult
      };
    } catch (error) {
      console.error('Error getting summary stats:', error);
      return {
        attendance: { present: 0, absent: 0 },
        totalBeneficiaries: 0,
        activitiesBreakdown: []
      };
    }
  }
}

export default new ReportModel(); 