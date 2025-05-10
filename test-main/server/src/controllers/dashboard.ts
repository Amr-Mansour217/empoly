import { Request, Response } from 'express';
import reportModel from '../models/report';
import userModel from '../models/user';

class DashboardController {
  // Get dashboard data for admin or supervisor
  async getDashboardData(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string || new Date().toISOString().split('T')[0];
      const endDate = req.query.endDate as string || new Date().toISOString().split('T')[0];
      
      let stats;
      let employees;
      
      if (req.user.role === 'admin') {
        // Admin can see all stats and employees
        stats = await reportModel.getSummaryStats(startDate, endDate);
        employees = await userModel.getAllEmployees();
      } else if (req.user.role === 'supervisor') {
        // Supervisor can only see stats and employees they supervise
        stats = await reportModel.getSummaryStats(startDate, endDate, req.user.id);
        employees = await userModel.getEmployeesBySupervisor(req.user.id);
      } else {
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
    } catch (error) {
      console.error('Get dashboard data error:', error);
      return res.status(500).json({ message: 'An error occurred while getting dashboard data' });
    }
  }
  
  // Get employee dashboard data
  async getEmployeeDashboard(req: Request, res: Response) {
    try {
      const employeeId = req.user.id;
      
      // Get current date
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's report if it exists
      const todayReport = await reportModel.getByEmployeeAndDate(employeeId, today);
      
      // Get supervisor
      const supervisor = await userModel.getSupervisorForEmployee(employeeId);
      
      // Get recent reports (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      
      const recentReports = await reportModel.getByEmployeeId(employeeId);
      
      return res.status(200).json({
        todayReport: todayReport || null,
        hasSubmittedToday: !!todayReport,
        supervisor: supervisor || null,
        recentReports: recentReports.slice(0, 7) // Limit to 7 most recent reports
      });
    } catch (error) {
      console.error('Get employee dashboard error:', error);
      return res.status(500).json({ message: 'An error occurred while getting dashboard data' });
    }
  }
}

export default new DashboardController(); 