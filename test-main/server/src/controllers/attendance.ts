import { Request, Response } from 'express';
import { pool } from '../config/db';
import reportModel from '../models/report';

class AttendanceController {
  // Get attendance for an employee
  async getEmployeeAttendance(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      // Check if user has permission to view this attendance
      if (req.user.role === 'employee' && employeeId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to view this attendance' });
      }
      
      // Get attendance records
      const [records]: any = await pool.execute(
        `SELECT a.*, u.full_name 
         FROM attendance a
         JOIN users u ON a.employee_id = u.id
         WHERE a.employee_id = ?
         ORDER BY a.date DESC`,
        [employeeId]
      );
      
      return res.status(200).json({ attendance: records });
    } catch (error) {
      console.error('Get employee attendance error:', error);
      return res.status(500).json({ message: 'An error occurred while getting attendance' });
    }
  }
  
  // Get attendance for all employees (admin/supervisor)
  async getAllAttendance(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      let query = `
        SELECT a.*, u.full_name 
        FROM attendance a
        JOIN users u ON a.employee_id = u.id
      `;
      
      let params = [];
      let whereClause = '';
      
      // Filter by date range if provided
      if (startDate && endDate) {
        whereClause = 'WHERE a.date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }
      
      // Filter by supervisor if user is a supervisor
      if (req.user.role === 'supervisor') {
        whereClause = whereClause ? 
          `${whereClause} AND es.supervisor_id = ?` : 
          'WHERE es.supervisor_id = ?';
        
        query = `
          SELECT a.*, u.full_name 
          FROM attendance a
          JOIN users u ON a.employee_id = u.id
          JOIN employee_supervisors es ON a.employee_id = es.employee_id
          ${whereClause}
          ORDER BY a.date DESC, u.full_name
        `;
        
        params.push(req.user.id);
      } else {
        query = `
          ${query}
          ${whereClause}
          ORDER BY a.date DESC, u.full_name
        `;
      }
      
      const [records]: any = await pool.execute(query, params);
      
      return res.status(200).json({ attendance: records });
    } catch (error) {
      console.error('Get all attendance error:', error);
      return res.status(500).json({ message: 'An error occurred while getting attendance' });
    }
  }
  
  // Get attendance for today
  async getTodayAttendance(req: Request, res: Response) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = `
        SELECT a.*, u.full_name 
        FROM attendance a
        JOIN users u ON a.employee_id = u.id
        WHERE a.date = ?
      `;
      
      let params = [today];
      
      // Filter by supervisor if user is a supervisor
      if (req.user.role === 'supervisor') {
        query = `
          SELECT a.*, u.full_name 
          FROM attendance a
          JOIN users u ON a.employee_id = u.id
          JOIN employee_supervisors es ON a.employee_id = es.employee_id
          WHERE a.date = ? AND es.supervisor_id = ?
          ORDER BY u.full_name
        `;
        
        params.push(req.user.id);
      } else {
        query = `
          ${query}
          ORDER BY u.full_name
        `;
      }
      
      const [records]: any = await pool.execute(query, params);
      
      // Count present and absent
      const present = records.filter((r: any) => r.status === 'present').length;
      const absent = records.filter((r: any) => r.status === 'absent').length;
      
      return res.status(200).json({ 
        attendance: records,
        summary: {
          date: today,
          present,
          absent,
          total: present + absent
        }
      });
    } catch (error) {
      console.error('Get today attendance error:', error);
      return res.status(500).json({ message: 'An error occurred while getting attendance' });
    }
  }
  
  // Manually mark attendance (admin only)
  async markAttendance(req: Request, res: Response) {
    try {
      const { employeeId, date, status } = req.body;
      
      if (!employeeId || !date || !status) {
        return res.status(400).json({ message: 'Employee ID, date, and status are required' });
      }
      
      if (status !== 'present' && status !== 'absent') {
        return res.status(400).json({ message: 'Status must be either "present" or "absent"' });
      }
      
      // Mark attendance
      const marked = await reportModel.markAttendance(employeeId, date, status);
      
      if (!marked) {
        return res.status(500).json({ message: 'Failed to mark attendance' });
      }
      
      return res.status(200).json({ message: 'Attendance marked successfully' });
    } catch (error) {
      console.error('Mark attendance error:', error);
      return res.status(500).json({ message: 'An error occurred while marking attendance' });
    }
  }
  
  // Run the daily attendance check manually (admin only)
  async runDailyAttendanceCheck(req: Request, res: Response) {
    try {
      const date = req.body.date || new Date().toISOString().split('T')[0];
      
      // Mark absent for employees who didn't submit a report
      const absentCount = await reportModel.markAbsentForMissingReports(date);
      
      return res.status(200).json({
        message: `Attendance check completed: ${absentCount} employees marked as absent for ${date}`
      });
    } catch (error) {
      console.error('Run daily attendance check error:', error);
      return res.status(500).json({ message: 'An error occurred while running attendance check' });
    }
  }
}

export default new AttendanceController(); 